import { AppError } from "../../common/errors/app-error.js";
export const createOnboardingService = (deps) => {
  const services = () => {
    if (!deps.services?.users || !deps.services?.nutritionProfiles)
      throw AppError.serviceUnavailable("Profile services unavailable");
    return deps.services;
  };
  const owner = async (actor, options = {}) => {
    if (!actor?.userId) throw AppError.unauthorized();
    if (actor.status !== "active") throw AppError.forbidden("Account is not active");
    return services().users.getById(actor.userId, options);
  };
  const status = async (userId, options = {}) => {
    const { users, nutritionProfiles } = services();
    const user = await users.getById(userId, options);
    const profile = await users.getProfile(userId, options);
    const nutrition = await nutritionProfiles.getByUserId(userId, options);
    const missingFields = [];
    if (!profile?.dietType) missingFields.push("dietType");
    if (nutrition?.allergenSelectionCompleted !== true) missingFields.push("allergenIds");
    if (!nutrition?.goal) missingFields.push("goal");
    if (!nutrition?.activityLevel) missingFields.push("activityLevel");
    return {
      completed: user.onboardingCompleted === true && missingFields.length === 0,
      readyToComplete: missingFields.length === 0,
      missingFields,
      steps: [
        { key: "diet", completed: Boolean(profile?.dietType) },
        { key: "allergens", completed: nutrition?.allergenSelectionCompleted === true },
        { key: "goal", completed: Boolean(nutrition?.goal) },
        { key: "activity", completed: Boolean(nutrition?.activityLevel) },
      ],
    };
  };
  const transactional = (work) => {
    if (!deps.transaction)
      throw AppError.serviceUnavailable("Transaction support is required", "TRANSACTIONS_REQUIRED");
    return deps.transaction(work);
  };
  const persistWithStandaloneFallback = async (work) => {
    try {
      return await transactional(work);
    } catch (error) {
      if (error?.code !== "TRANSACTIONS_REQUIRED") throw error;
      // A standalone MongoDB cannot open a multi-document transaction. Onboarding
      // writes are idempotent upserts and completion is verified from persisted
      // fields, so retry the workflow without a session. A failed partial write
      // remains incomplete and can safely be retried by the client.
      return work({});
    }
  };
  const auditMutation = async (actor, action, requestId, ipHash, before, after, session) => {
    if (actor.role === "admin") {
      if (!deps.audit?.record) throw AppError.serviceUnavailable("Audit service unavailable");
      await deps.audit.record({
        actor,
        action,
        targetType: "onboarding",
        targetId: String(actor.userId),
        before,
        after,
        requestId,
        ipHash,
        session,
      });
    }
  };
  const operations = {
    async getOnboardingStatus({ actor }) {
      await owner(actor);
      return status(actor.userId);
    },
    async updateOnboarding({ actor, body, requestId, ipHash }) {
      await owner(actor);
      if (body.allergenIds?.length) {
        if (!services().allergens?.getMany)
          throw AppError.serviceUnavailable("Allergen service unavailable");
        await services().allergens.getMany(body.allergenIds);
      }
      return persistWithStandaloneFallback(async (session) => {
        await owner(actor, { session });
        const { users, nutritionProfiles } = services();
        const before = await status(actor.userId, { session });
        const profile = Object.fromEntries(
          ["dietType", "timezone"].filter((k) => body[k] !== undefined).map((k) => [k, body[k]]),
        );
        const nutrition = Object.fromEntries(
          ["allergenIds", "goal", "activityLevel", "heightCm", "currentWeightKg"]
            .filter((k) => body[k] !== undefined)
            .map((k) => [k, body[k]]),
        );
        if (Object.keys(profile).length)
          await users.upsertProfile(actor.userId, profile, { session });
        if (Object.keys(nutrition).length)
          await nutritionProfiles.upsert(actor.userId, nutrition, { session });
        const after = await status(actor.userId, { session });
        await auditMutation(actor, "onboarding.update", requestId, ipHash, before, after, session);
        return after;
      });
    },
    async completeOnboarding({ actor, requestId, ipHash }) {
      await owner(actor);
      return persistWithStandaloneFallback(async (session) => {
        await owner(actor, { session });
        const before = await status(actor.userId, { session });
        if (!before.readyToComplete)
          throw AppError.badRequest(
            "Required onboarding fields are missing",
            before.missingFields.map((field) => ({ field })),
            "ONBOARDING_INCOMPLETE",
          );
        await services().users.setOnboardingCompleted(actor.userId, true, { session });
        const after = await status(actor.userId, { session });
        await auditMutation(
          actor,
          "onboarding.complete",
          requestId,
          ipHash,
          before,
          after,
          session,
        );
        return after;
      });
    },
  };
  return { operations, services: { getStatus: status } };
};
