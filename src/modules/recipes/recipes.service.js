import { dietFilter } from "../../common/utils/diet.js";
import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { NOTIFICATION_TYPES } from "../../common/constants/enums/notification.enums.js";
import { requireFound, publicFilter, slug, objectIdString } from "../../common/domain.js";
import { calculateRecipeNutrition, normalizeCalories } from "../../common/utils/nutrition.js";
import { quantityToGrams } from "../../common/utils/units.js";
import { presentContentMedia } from "../../common/utils/media-presentation.js";
import {
  requireActor,
  transaction,
  auditAdmin,
  getReadable,
  safeContent,
  assertEditable,
  casUpdate,
  listFilter,
  listOptions,
  lifecycle,
  syncMedia,
  userState,
} from "../../common/content-service.js";

export const createRecipesService = (deps) => {
  const repo = deps.repositories.recipes;
  const presentRecipe = (recipe, actor) =>
    presentContentMedia(deps, safeContent(recipe, { actor }), { actor, type: "recipe" });
  const presentPage = async (page, actor) => ({
    ...page,
    data: await Promise.all(page.data.map((recipe) => presentRecipe(recipe, actor))),
  });
  const resolveIngredients = async (ingredients, session) => {
    const foodService = deps.services?.foodItems;
    const resolved = [];
    for (const [index, input] of ingredients.entries()) {
      const food = requireFound(
        foodService?.getById
          ? await foodService.getById(input.foodItemId, { session })
          : await deps.repositories.foodItems?.findById(input.foodItemId, { session }),
        "Food item not found",
      );
      if (food.status !== "active")
        throw AppError.badRequest("Ingredients must use active food items");
      const gramEquivalent = quantityToGrams(input.quantity, input.unit, {
        gramEquivalent: input.gramEquivalent,
        defaultServing: food.defaultServing,
      });
      if (gramEquivalent == null)
        throw AppError.badRequest("A gram equivalent is required for this ingredient unit");
      if (!food.nutritionPer100g) throw AppError.badRequest("Ingredient nutrition is unavailable");
      resolved.push({
        foodItemId: food._id,
        foodNameSnapshot: food.name,
        nutritionPer100g: food.nutritionPer100g,
        allergenIds: (food.allergenIds ?? []).map(objectIdString),
        isVegan: food.isVegan === true,
        isVegetarian: food.isVegetarian === true || food.isVegan === true,
        containsEggs: food.isVegan === true ? false : food.containsEggs,
        containsDairy: food.isVegan === true ? false : food.containsDairy,
        quantity: input.quantity,
        unit: input.unit,
        gramEquivalent,
        note: input.note,
        optional: input.optional ?? false,
        order: input.order ?? index + 1,
      });
    }
    return resolved;
  };
  const snapshots = (ingredients, servings) => {
    let nutritionPerServing;
    try {
      nutritionPerServing = calculateRecipeNutrition(ingredients, { servings });
    } catch {
      throw AppError.badRequest("Unable to calculate nutrition from these ingredients");
    }
    const normalizedCalories = normalizeCalories(nutritionPerServing);
    return {
      nutritionPerServing: normalizedCalories.nutrition,
      nutritionCalculation: normalizedCalories.calculation,
      allergenIds: [...new Set(ingredients.flatMap((ingredient) => ingredient.allergenIds ?? []))],
      isVegan: ingredients.length > 0 && ingredients.every((i) => i.isVegan),
      isVegetarian: ingredients.length > 0 && ingredients.every((i) => i.isVegetarian),
      ...Object.fromEntries(
        ["containsEggs", "containsDairy"].map((key) => [
          key,
          ingredients.some((i) => i[key] === true)
            ? true
            : ingredients.length > 0 && ingredients.every((i) => i[key] === false)
              ? false
              : null,
        ]),
      ),
    };
  };
  const resolveVariants = async (variants = [], defaultServings, session) => {
    const resolved = [];
    for (const input of variants) {
      const ingredients = await resolveIngredients(input.ingredients, session);
      const servings = input.servings ?? defaultServings;
      const variantSnapshots = snapshots(ingredients, servings);
      resolved.push({
        ...input,
        variantId: input.variantId ?? randomUUID(),
        servings,
        ingredients,
        nutritionPerServing: variantSnapshots.nutritionPerServing,
        allergenIds: variantSnapshots.allergenIds,
      });
    }
    return resolved;
  };
  const validatePublication = async (recipe, actor, session) => {
    if (!recipe.title || !recipe.ingredients?.length || !recipe.steps?.length)
      throw AppError.badRequest("A recipe requires ingredients and preparation steps");
    await syncMedia(deps, "recipe", recipe, recipe, actor, session);
  };
  const listPublic = async (query = {}, options = {}) => {
    const filter = listFilter(query);
    if (query.foodItemId) filter["ingredients.foodItemId"] = query.foodItemId;
    if (query.cuisine) filter.cuisine = query.cuisine;
    if (query.maxTotalMinutes) filter.totalMinutes = { $lte: query.maxTotalMinutes };
    if (query.excludeAllergenIds?.length) filter.allergenIds = { $nin: query.excludeAllergenIds };
    const diet = dietFilter(query.dietType);
    if (Object.keys(diet).length) filter.$and = [...(filter.$and ?? []), diet];
    return presentPage(
      await repo.findMany(publicFilter(filter), { ...listOptions(query), ...options }),
    );
  };
  const listMine = (userId, query = {}) =>
    repo.findMany(
      {
        authorId: userId,
        ...(query.status
          ? { status: query.status }
          : { deletedAt: null, status: { $ne: "deleted" } }),
      },
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        sort: { updatedAt: -1, _id: -1 },
        projection: { viewReceipts: 0, ratingSum: 0 },
      },
    );
  const getById = (id, options = {}) => getReadable(repo, id, options);
  const buildSubstitutions = async (recipe, actor, query = {}) => {
    if (!actor?.userId || !query.includeSubstitutions) return undefined;
    const variant = query.variantId
      ? (recipe.variants ?? []).find((item) => item.variantId === query.variantId)
      : null;
    if (query.variantId && !variant) throw AppError.notFound("Recipe variant not found");
    const [profile, nutritionProfile] = await Promise.all([
      deps.services.users?.getProfile?.(actor.userId),
      deps.services.users?.getNutrition?.(actor.userId),
    ]);
    const excludedAllergenIds = [
      ...new Set(
        [
          ...(query.excludeAllergenIds ?? []),
          ...(profile?.allergenIds ?? []),
          ...(nutritionProfile?.allergenIds ?? []),
        ].map(String),
      ),
    ];
    if (!excludedAllergenIds.length) return [];
    const excluded = new Set(excludedAllergenIds);
    const ingredients = variant?.ingredients ?? recipe.ingredients ?? [];
    const unsafe = ingredients.filter((ingredient) =>
      (ingredient.allergenIds ?? []).some((allergenId) => excluded.has(String(allergenId))),
    );
    const suggestions = [];
    for (const ingredient of unsafe) {
      const source = await deps.services.foodItems?.getById?.(ingredient.foodItemId);
      if (!source) continue;
      const result = await deps.services.foodItems.search({
        categoryId: source.categoryId,
        excludeAllergenIds: excludedAllergenIds,
        isVegan: true,
        page: 1,
        limit: 20,
      });
      const sourceCalories = Number(source.nutritionPer100g?.caloriesKcal ?? 0);
      const alternatives = (result.data ?? result)
        .filter((food) => String(food._id) !== String(source._id))
        .map((food) => {
          const alternativeCalories = Number(food.nutritionPer100g?.caloriesKcal ?? 0);
          const quantityRatio = Math.min(
            4,
            Math.max(
              0.25,
              sourceCalories > 0 && alternativeCalories > 0
                ? sourceCalories / alternativeCalories
                : 1,
            ),
          );
          return {
            food,
            quantityRatio: Number(quantityRatio.toFixed(2)),
            recommendedQuantity: Number((ingredient.quantity * quantityRatio).toFixed(2)),
            unit: ingredient.unit,
            reason: "Same food category with saved allergens excluded",
            guidance:
              ingredient.unit === "g"
                ? "Replace by the suggested weight, then adjust seasoning and texture while cooking."
                : "Use the ratio as a starting point; confirm the gram equivalent for volume or piece units.",
            nutritionDistance:
              sourceCalories > 0
                ? Math.abs(alternativeCalories - sourceCalories) / sourceCalories
                : 1,
          };
        })
        .sort(
          (left, right) =>
            left.nutritionDistance - right.nutritionDistance ||
            left.food.name.localeCompare(right.food.name),
        )
        .slice(0, 5)
        .map(({ nutritionDistance: _nutritionDistance, ...item }) => item);
      suggestions.push({ ingredient, alternatives });
    }
    return suggestions;
  };
  const operations = {
    getRecipes: async ({ query = {} }) => listPublic(query),
    getMyRecipes: async ({ actor, query = {} }) => {
      requireActor(actor);
      const result = await listMine(actor.userId, query);
      return presentPage(result, actor);
    },
    getRecipe: async ({ actor, params, query = {} }) => {
      const recipe = await getReadable(repo, params.idOrSlug, { actor, slug: true });
      const substitutions = await buildSubstitutions(recipe, actor, query);
      return {
        ...(await presentRecipe(recipe, actor)),
        ...(await userState(deps, "recipe", recipe._id, actor)),
        ...(substitutions === undefined ? {} : { substitutions }),
      };
    },
    createRecipe: async (context) => {
      const recipe = await transaction(deps, async (session) => {
        const { actor, body } = context;
        requireActor(actor);
        const ingredients = await resolveIngredients(body.ingredients ?? [], session);
        const variants = await resolveVariants(body.variants ?? [], body.servings ?? 1, session);
        const recipe = await repo.create(
          {
            ...body,
            ingredients,
            variants,
            ...snapshots(ingredients, body.servings ?? 1),
            slug: `${slug(body.title)}-${randomUUID().slice(0, 8)}`,
            authorId: actor.userId,
            sourceType: actor.role === "admin" ? "admin" : "community",
            status: "draft",
            visibility: body.visibility ?? "public",
            servings: body.servings ?? 1,
            prepMinutes: body.prepMinutes ?? 0,
            cookMinutes: body.cookMinutes ?? 0,
            totalMinutes: (body.prepMinutes ?? 0) + (body.cookMinutes ?? 0),
            version: 0,
            deletedAt: null,
          },
          { session },
        );
        await syncMedia(deps, "recipe", null, recipe, actor, session);
        await auditAdmin(deps, context, "recipe", null, recipe, "recipe.create", session);
        return recipe;
      });
      return presentRecipe(recipe, context.actor);
    },
    updateRecipe: async (context) => {
      const recipe = await transaction(deps, async (session) => {
        const { actor, params, body } = context;
        const before = requireFound(await repo.findById(params.id, { session }));
        assertEditable(before, actor);
        const { version, ...changes } = body;
        const ingredients = changes.ingredients
          ? await resolveIngredients(changes.ingredients, session)
          : before.ingredients;
        if (changes.variants)
          changes.variants = await resolveVariants(
            changes.variants,
            changes.servings ?? before.servings,
            session,
          );
        if (changes.ingredients || changes.servings != null)
          Object.assign(changes, snapshots(ingredients, changes.servings ?? before.servings), {
            ingredients,
          });
        if (changes.prepMinutes != null || changes.cookMinutes != null)
          changes.totalMinutes =
            (changes.prepMinutes ?? before.prepMinutes ?? 0) +
            (changes.cookMinutes ?? before.cookMinutes ?? 0);
        if (before.status === "rejected")
          Object.assign(changes, { status: "draft", rejectionReason: null });
        if (before.status === "published" && actor.role !== "admin")
          Object.assign(changes, { status: "draft", publishedAt: null });
        const candidate = { ...before, ...changes };
        await syncMedia(deps, "recipe", before, candidate, actor, session);
        if (before.status === "published") await validatePublication(candidate, actor, session);
        const after = await casUpdate(repo, before, changes, { version, session });
        await auditAdmin(deps, context, "recipe", before, after, "recipe.update", session);
        return after;
      });
      return presentRecipe(recipe, context.actor);
    },
    deleteRecipe: async (context) =>
      presentRecipe(
        await lifecycle(deps, repo, "recipe", context, "delete", validatePublication),
        context.actor,
      ),
    submitRecipe: async (context) =>
      presentRecipe(
        await lifecycle(deps, repo, "recipe", context, "submit", validatePublication),
        context.actor,
      ),
    publishRecipe: async (context) => {
      const recipe = await lifecycle(deps, repo, "recipe", context, "publish", validatePublication);
      await deps.services.notifications?.deliverActivity?.({
        recipientId: recipe.authorId,
        actorId: context.actor.userId,
        type: NOTIFICATION_TYPES.RECIPE_APPROVED,
        targetType: "recipe",
        targetId: recipe._id,
        targetTitle: recipe.title,
        deliveryKey: `recipe:${recipe._id}:approved:${recipe.version ?? 0}`,
      });
      return presentRecipe(recipe, context.actor);
    },
    rejectRecipe: async (context) => {
      const recipe = await lifecycle(deps, repo, "recipe", context, "reject", validatePublication);
      await deps.services.notifications?.deliverActivity?.({
        recipientId: recipe.authorId,
        actorId: context.actor.userId,
        type: NOTIFICATION_TYPES.RECIPE_REJECTED,
        targetType: "recipe",
        targetId: recipe._id,
        targetTitle: recipe.title,
        reason: recipe.rejectionReason,
        deliveryKey: `recipe:${recipe._id}:rejected:${recipe.version ?? 0}`,
      });
      return presentRecipe(recipe, context.actor);
    },
    getRecipeNutrition: async ({ params }) => {
      const recipe = await getById(params.id, { publicOnly: true });
      return {
        recipeId: recipe._id,
        servings: recipe.servings,
        nutritionPerServing: recipe.nutritionPerServing,
        nutritionCalculation: recipe.nutritionCalculation,
        allergenIds: recipe.allergenIds,
      };
    },
  };
  return {
    operations,
    service: {
      getById,
      getMany: async (ids, options = {}) => {
        const results = [];
        for (const id of ids) results.push(await getById(id, options));
        return results;
      },
      listPublic,
      listMine,
      validatePublication,
    },
  };
};
