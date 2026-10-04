import { dietFilter, fitsDiet } from "../../common/utils/diet.js";
import { contentCardProjection } from "../../common/utils/content-card.js";
import { z } from "zod";
import {
  user,
  integer,
  service,
  repository,
  publicFilter,
  isPublic,
  summarizeContent,
  listData,
  now,
} from "../app-config/index.js";
const querySchema = z.object({ page: integer(10, 1), limit: integer(30, 10) }).strict();
export const recommendationValidation = Object.fromEntries(
  ["discoverContent", "getRecipeRecommendations", "getContentRecommendations"].map((key) => [
    key,
    { query: querySchema },
  ]),
);
const stringId = (value) => String(value?._id ?? value ?? "");
const hasAllergen = (item, allergies) =>
  [
    ...(item.allergenIds ?? []),
    ...(item.ingredients ?? []).flatMap(
      (ingredient) => ingredient.allergenIds ?? ingredient.foodSnapshot?.allergenIds ?? [],
    ),
  ].some((id) => allergies.has(stringId(id)));
export const createRecommendationsService = (deps) => {
  const context = async (actor) => {
    if (!actor?.userId)
      return {
        allergies: new Set(),
        pantry: new Set(),
        dietType: null,
        calorieTarget: null,
        goal: null,
      };
    const userId = user(actor);
    const [profile, nutrition, pantry] = await Promise.all([
      service(deps, "users", "getProfile")(userId),
      service(deps, "users", "getNutrition")(userId),
      service(deps, "pantries", "getForUser")(userId),
    ]);
    const items = Array.isArray(pantry) ? pantry : (pantry?.items ?? listData(pantry));
    return {
      allergies: new Set(
        (nutrition?.allergenIds ?? profile?.allergenIds ?? profile?.allergies ?? []).map(stringId),
      ),
      pantry: new Set(
        items
          .filter(
            (item) =>
              (item.quantity ?? 0) > 0 &&
              (!item.expiresAt || new Date(item.expiresAt) > now(deps)) &&
              (!item.expiryDate || new Date(item.expiryDate) >= now(deps)),
          )
          .map((item) => stringId(item.foodItemId)),
      ),
      dietType: profile?.dietType ?? null,
      calorieTarget:
        nutrition?.dailyCalorieTarget ??
        nutrition?.calorieTarget ??
        nutrition?.targets?.caloriesKcal ??
        null,
      goal: nutrition?.goal ?? profile?.goal ?? null,
    };
  };
  const rank = async (type, ctx) => {
    const key = { recipe: "recipes", post: "posts", video: "videos" }[type];
    const filter = { ...publicFilter };
    if (ctx.allergies.size) filter.allergenIds = { $nin: [...ctx.allergies] };
    if (type === "recipe") Object.assign(filter, dietFilter(ctx.dietType));
    const { data } = await repository(deps, key).findMany(filter, {
      page: 1,
      limit: 200,
      projection: {
        ...contentCardProjection,
        isVegan: 1,
        isVegetarian: 1,
        dietTypes: 1,
        "ingredients.foodItemId": 1,
        "ingredients.allergenIds": 1,
      },
      sort: { publishedAt: -1, _id: -1 },
    });
    const foodIds = [
      ...new Set(
        data.flatMap((item) =>
          (item.ingredients ?? [])
            .map((ingredient) => stringId(ingredient.foodItemId))
            .filter(Boolean),
        ),
      ),
    ];
    const ingredientAllergies = new Set();
    if (ctx.allergies.size && foodIds.length) {
      for (let index = 0; index < foodIds.length; index += 100) {
        const foods = await repository(deps, "foodItems").findMany(
          {
            _id: { $in: foodIds.slice(index, index + 100) },
            allergenIds: { $in: [...ctx.allergies] },
          },
          { page: 1, limit: 100, projection: { _id: 1 } },
        );
        for (const food of foods.data) ingredientAllergies.add(stringId(food));
      }
    }
    return data
      .filter(
        (item) =>
          isPublic(item) &&
          !hasAllergen(item, ctx.allergies) &&
          !(item.ingredients ?? []).some((ingredient) =>
            ingredientAllergies.has(stringId(ingredient.foodItemId)),
          ) &&
          (type !== "recipe" || fitsDiet(item, ctx.dietType)),
      )
      .map((item) => {
        const ingredientIds = [
          ...new Set(
            (item.ingredients ?? [])
              .map((ingredient) => stringId(ingredient.foodItemId))
              .filter(Boolean),
          ),
        ];
        const matches = ingredientIds.filter((id) => ctx.pantry.has(id)).length;
        const pantryRatio = ingredientIds.length ? matches / ingredientIds.length : 0;
        const reasons = [];
        let score = 0;
        if (
          ctx.dietType &&
          (type === "recipe"
            ? fitsDiet(item, ctx.dietType)
            : item.dietTypes?.includes(ctx.dietType))
        ) {
          score += 30;
          reasons.push(`Matches your ${ctx.dietType} diet`);
        }
        if (matches) {
          score += pantryRatio * 50;
          reasons.push(
            `${matches} of ${ingredientIds.length} ingredients available in your pantry`,
          );
        }
        const calories = item.nutritionPerServing?.caloriesKcal;
        if (
          ctx.calorieTarget &&
          typeof calories === "number" &&
          calories <= ctx.calorieTarget / 3
        ) {
          score += 10;
          reasons.push("Fits your estimated per-meal calorie target");
        }
        if (ctx.goal && item.tags?.includes(ctx.goal)) {
          score += 10;
          reasons.push("Matches your selected goal");
        }
        if (!reasons.length) reasons.push("Recently published public content");
        return {
          ...summarizeContent(item),
          type,
          recommendation: {
            score: Math.round(score * 100) / 100,
            reasons,
            pantryMatch: { matched: matches, total: ingredientIds.length },
            allergenExclusionsApplied: ctx.allergies.size > 0,
          },
        };
      });
  };
  const recommend = async (actor, query, types) => {
    const ctx = await context(actor);
    const ranked = (await Promise.all(types.map((type) => rank(type, ctx))))
      .flat()
      .sort(
        (a, b) =>
          b.recommendation.score - a.recommendation.score ||
          new Date(b.publishedAt ?? 0) - new Date(a.publishedAt ?? 0) ||
          stringId(b).localeCompare(stringId(a)),
      );
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    return {
      data: ranked.slice((page - 1) * limit, page * limit),
      meta: {
        page,
        limit,
        total: ranked.length,
        totalPages: Math.ceil(ranked.length / limit),
        candidateLimitPerType: 200,
        ranking: "diet-pantry-goal-v1",
      },
    };
  };
  return {
    async discoverContent({ actor, query = {} }) {
      return recommend(actor, query, ["recipe", "post", "video"]);
    },
    async getRecipeRecommendations({ actor, query = {} }) {
      user(actor);
      return recommend(actor, query, ["recipe"]);
    },
    async getContentRecommendations({ actor, query = {} }) {
      user(actor);
      return recommend(actor, query, ["recipe", "post", "video"]);
    },
  };
};
