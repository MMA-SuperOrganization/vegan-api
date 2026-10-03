import { AppError } from "../../common/errors/app-error.js";
import { id } from "../../common/validators/domain.schemas.js";
import { nutritionProfileSchema } from "./nutrition-profiles.validation.js";

const targets = [
  "dailyCalorieTarget",
  "proteinTargetG",
  "carbTargetG",
  "fatTargetG",
  "fiberTargetG",
  "waterTargetMl",
];
const rounded = (v) => Math.round(v * 10) / 10;
const disclaimer =
  "Nutrition and BMI values are estimates for general information, not a diagnosis or medical advice.";
const safe = (value) => {
  if (!value) return null;
  const keys = [
    "_id",
    "userId",
    "heightCm",
    "currentWeightKg",
    "activityLevel",
    "goal",
    ...targets,
    "allergenIds",
    "allergenSelectionCompleted",
    "medicalNotes",
    "bmi",
    "bmiCategory",
    "calculatedAt",
    "targetSource",
    "calculationWarnings",
    "createdAt",
    "updatedAt",
  ];
  const result = Object.fromEntries(
    keys.filter((key) => value[key] !== undefined).map((key) => [key, value[key]]),
  );
  return { ...result, isEstimate: true, disclaimer };
};
export const createNutritionProfilesService = ({ deps, repository }) => {
  const now = () =>
    new Date(typeof deps.clock === "function" ? deps.clock() : (deps.clock?.now?.() ?? Date.now()));
  const userService = () => {
    if (!deps.services?.users) throw AppError.serviceUnavailable("User service unavailable");
    return deps.services.users;
  };
  const getByUserId = async (userId, options = {}) =>
    safe(await repository.findOne({ userId: id.parse(String(userId)) }, options));
  const assertOwner = async (actor) => {
    if (!actor?.userId) throw AppError.unauthorized();
    if (actor.status !== "active") throw AppError.forbidden("Account is not active");
    await userService().getById(actor.userId);
    return id.parse(String(actor.userId));
  };
  const calculate = async (userId, values, options) => {
    const fullProfile = await userService().getProfile(userId, options);
    const current = now();
    const warnings = [disclaimer];
    const result = {
      calculatedAt: current,
      calculationWarnings: warnings,
      targetSource: "insufficient_data",
    };
    let age;
    if (fullProfile?.dateOfBirth) {
      const dob = new Date(fullProfile.dateOfBirth);
      age = current.getUTCFullYear() - dob.getUTCFullYear();
      if (
        current.getUTCMonth() < dob.getUTCMonth() ||
        (current.getUTCMonth() === dob.getUTCMonth() && current.getUTCDate() < dob.getUTCDate())
      )
        age -= 1;
    }
    if (values.heightCm && values.currentWeightKg) {
      const bmi = values.currentWeightKg / (values.heightCm / 100) ** 2;
      result.bmi = rounded(bmi);
      if (age >= 18)
        result.bmiCategory =
          bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese";
      else warnings.push("Adult BMI categories are unavailable without confirmed adult age.");
    }
    const manual = new Set(values.manualTargetFields ?? []);
    for (const key of manual) if (values[key] != null) result[key] = values[key];
    if (manual.size) result.targetSource = "user";
    if (age < 18)
      warnings.push(
        "Automated calorie targets are not provided for minors; consult a qualified professional.",
      );
    const sex = fullProfile?.gender;
    const eligible =
      age >= 18 &&
      age <= 100 &&
      ["male", "female"].includes(sex) &&
      values.heightCm &&
      values.currentWeightKg &&
      values.activityLevel &&
      values.goal &&
      !values.medicalNotes;
    if (eligible) {
      const factor = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      }[values.activityLevel];
      const basal =
        10 * values.currentWeightKg +
        6.25 * values.heightCm -
        5 * age +
        (sex === "male" ? 5 : -161);
      const adjustment =
        values.goal === "lose_weight" ? -250 : values.goal === "gain_weight" ? 250 : 0;
      const energy = Math.round(
        Math.max(sex === "male" ? 1500 : 1200, Math.min(6000, basal * factor + adjustment)),
      );
      const targetEnergy = manual.has("dailyCalorieTarget") ? values.dailyCalorieTarget : energy;
      const estimated = {
        dailyCalorieTarget: energy,
        proteinTargetG: rounded((targetEnergy * 0.2) / 4),
        carbTargetG: rounded((targetEnergy * 0.5) / 4),
        fatTargetG: rounded((targetEnergy * 0.3) / 9),
        fiberTargetG: rounded(Math.min(60, (targetEnergy / 1000) * 14)),
        waterTargetMl: Math.round(Math.min(4000, Math.max(1500, values.currentWeightKg * 30))),
      };
      for (const key of targets) if (!manual.has(key)) result[key] = estimated[key];
      if (!manual.size) result.targetSource = "estimated";
    } else
      warnings.push(
        "Calorie estimates require adult birth date, applicable sex input, height, weight, activity and goal; medical conditions require professional guidance. No demographic values are assumed.",
      );
    return result;
  };
  const persist = async (userId, body, options = {}) => {
    userId = id.parse(String(userId));
    const data = nutritionProfileSchema.parse(body);
    await userService().getById(userId, options);
    if (data.allergenIds?.length) {
      if (!deps.services?.allergens?.getMany)
        throw AppError.serviceUnavailable("Allergen service unavailable");
      await deps.services.allergens.getMany(data.allergenIds, options);
    }
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const current = await repository.findOne({ userId }, options);
      const manual = [
        ...new Set([
          ...(current?.manualTargetFields ?? []),
          ...targets.filter((key) => data[key] !== undefined),
        ]),
      ];
      const merged = { ...current, ...data, manualTargetFields: manual };
      const calculated = await calculate(userId, merged, options);
      const set = {
        ...data,
        ...calculated,
        manualTargetFields: manual,
        ...(data.allergenIds !== undefined ? { allergenSelectionCompleted: true } : {}),
      };
      const unset = Object.fromEntries(
        [...targets, "bmi", "bmiCategory"]
          .filter(
            (key) =>
              set[key] === undefined && calculated[key] === undefined && !manual.includes(key),
          )
          .map((key) => [key, 1]),
      );
      const filter = current
        ? {
            _id: current._id,
            userId,
            version: current.version === undefined ? { $exists: false } : current.version,
          }
        : { userId, version: { $exists: false } };
      try {
        const saved = await repository.updateOne(
          filter,
          {
            $set: set,
            ...(Object.keys(unset).length ? { $unset: unset } : {}),
            $inc: { version: 1 },
            ...(!current ? { $setOnInsert: { userId } } : {}),
          },
          { ...options, upsert: !current, new: true },
        );
        if (saved) return safe(saved);
      } catch (error) {
        // A transaction must be restarted by withTransaction after a write conflict;
        // only standalone first-creation duplicate races are safe to retry here.
        if (options.session || error.code !== 11000) throw error;
      }
    }
    throw AppError.conflict(
      "Nutrition profile changed concurrently; retry",
      [],
      "VERSION_CONFLICT",
    );
  };
  const recalculate = async (userId, options = {}) => {
    const existing = await repository.findOne({ userId: id.parse(String(userId)) }, options);
    if (!existing) throw AppError.notFound("Nutrition profile not found");
    return persist(userId, {}, options);
  };
  const mutate = async (context, action, work) => {
    const userId = await assertOwner(context.actor);
    if (context.actor.role !== "admin") return work(userId, {});
    if (!deps.transaction || !deps.audit?.record)
      throw AppError.serviceUnavailable("Transaction and audit support are required");
    return deps.transaction(async (session) => {
      await userService().getById(userId, { session });
      const result = await work(userId, { session });
      await deps.audit.record({
        actor: context.actor,
        action,
        targetType: "nutritionProfile",
        targetId: userId,
        before: null,
        after: {
          userId,
          changedFields: Object.keys(context.body ?? {}),
          calculatedAt: result.calculatedAt,
        },
        requestId: context.requestId,
        ipHash: context.ipHash,
        session,
      });
      return result;
    });
  };
  return {
    operations: {
      async getMyNutritionProfile({ actor }) {
        return getByUserId(await assertOwner(actor));
      },
      upsertMyNutritionProfile: (context) =>
        mutate(context, "nutritionProfile.upsert", (userId, options) =>
          persist(userId, context.body, options),
        ),
      recalculateNutritionTarget: (context) =>
        mutate(context, "nutritionProfile.recalculate", (userId, options) =>
          recalculate(userId, options),
        ),
    },
    services: { getByUserId, upsert: persist, recalculate },
  };
};
