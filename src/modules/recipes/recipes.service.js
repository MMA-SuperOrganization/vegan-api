import { dietFilter } from "../../common/utils/diet.js";
import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error.js";
import { requireFound, publicFilter, slug, objectIdString } from "../../common/domain.js";
import { calculateRecipeNutrition } from "../../common/utils/nutrition.js";
import { quantityToGrams } from "../../common/utils/units.js";
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
    return {
      nutritionPerServing,
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
  const validatePublication = async (recipe, actor, session) => {
    if (!recipe.title || !recipe.ingredients?.length || !recipe.steps?.length)
      throw AppError.badRequest("A recipe requires ingredients and preparation steps");
    await syncMedia(deps, "recipe", recipe, recipe, actor, session);
  };
  const listPublic = async (query = {}, options = {}) => {
    const filter = listFilter(query);
    if (query.cuisine) filter.cuisine = query.cuisine;
    if (query.maxTotalMinutes) filter.totalMinutes = { $lte: query.maxTotalMinutes };
    if (query.excludeAllergenIds?.length) filter.allergenIds = { $nin: query.excludeAllergenIds };
    const diet = dietFilter(query.dietType);
    if (Object.keys(diet).length) filter.$and = [...(filter.$and ?? []), diet];
    return repo.findMany(publicFilter(filter), { ...listOptions(query), ...options });
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
  const operations = {
    getRecipes: async ({ query = {} }) => listPublic(query),
    getMyRecipes: async ({ actor, query = {} }) => {
      requireActor(actor);
      const result = await listMine(actor.userId, query);
      return { ...result, data: result.data.map((item) => safeContent(item, { actor })) };
    },
    getRecipe: async ({ actor, params }) => {
      const recipe = await getReadable(repo, params.idOrSlug, { actor, slug: true });
      return {
        ...safeContent(recipe, { actor }),
        ...(await userState(deps, "recipe", recipe._id, actor)),
      };
    },
    createRecipe: async (context) =>
      transaction(deps, async (session) => {
        const { actor, body } = context;
        requireActor(actor);
        const ingredients = await resolveIngredients(body.ingredients ?? [], session);
        const recipe = await repo.create(
          {
            ...body,
            ingredients,
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
        return safeContent(recipe, { actor });
      }),
    updateRecipe: async (context) =>
      transaction(deps, async (session) => {
        const { actor, params, body } = context;
        const before = requireFound(await repo.findById(params.id, { session }));
        assertEditable(before, actor);
        const { version, ...changes } = body;
        const ingredients = changes.ingredients
          ? await resolveIngredients(changes.ingredients, session)
          : before.ingredients;
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
        const candidate = { ...before, ...changes };
        await syncMedia(deps, "recipe", before, candidate, actor, session);
        if (before.status === "published") await validatePublication(candidate, actor, session);
        const after = await casUpdate(repo, before, changes, { version, session });
        await auditAdmin(deps, context, "recipe", before, after, "recipe.update", session);
        return safeContent(after, { actor });
      }),
    deleteRecipe: (context) =>
      lifecycle(deps, repo, "recipe", context, "delete", validatePublication),
    submitRecipe: (context) =>
      lifecycle(deps, repo, "recipe", context, "submit", validatePublication),
    publishRecipe: (context) =>
      lifecycle(deps, repo, "recipe", context, "publish", validatePublication),
    rejectRecipe: (context) =>
      lifecycle(deps, repo, "recipe", context, "reject", validatePublication),
    getRecipeNutrition: async ({ params }) => {
      const recipe = await getById(params.id, { publicOnly: true });
      return {
        recipeId: recipe._id,
        servings: recipe.servings,
        nutritionPerServing: recipe.nutritionPerServing,
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
