import { AppError } from "../../common/errors/app-error.js";
import { normalizeSearchText } from "../../common/utils/fuzzy-search.js";
import { fuzzyMongoRegex } from "../../common/utils/fuzzy-search.js";
import { personalIngredientInput } from "./personal-ingredients.validation.js";

const owner = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  return actor.userId;
};

const publicIngredient = ({ userId: _userId, normalizedName: _normalizedName, ...ingredient }) =>
  ingredient;

const personalSuggestion = (ingredient) => ({
  id: String(ingredient._id),
  source: "personal",
  name: ingredient.name,
  defaultUnit: ingredient.defaultUnit,
  personalIngredientId: String(ingredient._id),
});

const catalogSuggestion = (food) => ({
  id: String(food._id),
  source: "catalog",
  name: food.name,
  defaultUnit: food.defaultServing?.unit ?? "piece",
  foodItemId: String(food._id),
});

const suggestionRank = (query, suggestion) => {
  const name = normalizeSearchText(suggestion.name);
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  return 2;
};

export function createPersonalIngredientsService({ repository, services = {} }) {
  const getOwned = async (userId, id, options = {}) => {
    const ingredient = await repository.findOne({ _id: id, userId }, options);
    if (!ingredient) throw AppError.notFound("Personal ingredient not found");
    return ingredient;
  };

  const ensureUnique = async (userId, normalizedName, ignoreId, options = {}) => {
    const existing = await repository.findOne({ userId, normalizedName }, options);
    if (existing && String(existing._id) !== String(ignoreId ?? ""))
      throw AppError.conflict("You already have a personal ingredient with this name");
  };

  const createForUser = async (userId, input, options = {}) => {
    const body = personalIngredientInput.parse(input);
    const normalizedName = normalizeSearchText(body.name);
    await ensureUnique(userId, normalizedName, null, options);
    return publicIngredient(
      await repository.create(
        { ...body, userId, normalizedName, status: "active" },
        { session: options.session },
      ),
    );
  };

  const operations = {
    getIngredientSuggestions: async ({ actor, query }) => {
      const userId = owner(actor);
      const personalResult = await repository.findMany(
        {
          userId,
          status: "active",
          $or: [{ name: fuzzyMongoRegex(query.q) }, { normalizedName: fuzzyMongoRegex(query.q) }],
        },
        { page: 1, limit: query.limit, sort: { normalizedName: 1, _id: 1 } },
      );
      const catalogResult = services.foodItems?.search
        ? await services.foodItems.search({ q: query.q, page: 1, limit: query.limit })
        : { data: [] };
      const normalizedQuery = normalizeSearchText(query.q);
      return [
        ...personalResult.data.map(personalSuggestion),
        ...(catalogResult.data ?? []).map(catalogSuggestion),
      ]
        .sort(
          (left, right) =>
            suggestionRank(normalizedQuery, left) - suggestionRank(normalizedQuery, right) ||
            left.name.localeCompare(right.name) ||
            (left.source === right.source ? 0 : left.source === "personal" ? -1 : 1),
        )
        .slice(0, query.limit);
    },
    getPersonalIngredients: async ({ actor, query = {} }) => {
      const filter = { userId: owner(actor), status: "active" };
      if (query.q)
        filter.$or = [
          { name: fuzzyMongoRegex(query.q) },
          { normalizedName: fuzzyMongoRegex(query.q) },
        ];
      const result = await repository.findMany(filter, {
        page: query.page,
        limit: query.limit,
        sort: { normalizedName: 1, _id: 1 },
      });
      return { ...result, data: result.data.map(publicIngredient) };
    },
    createPersonalIngredient: async ({ actor, body }) => createForUser(owner(actor), body),
    updatePersonalIngredient: async ({ actor, params, body }) => {
      const userId = owner(actor);
      const before = await getOwned(userId, params.id);
      const changes = { ...body };
      if (changes.name) {
        changes.normalizedName = normalizeSearchText(changes.name);
        await ensureUnique(userId, changes.normalizedName, before._id);
      }
      const updated = await repository.updateOne({ _id: before._id, userId }, { $set: changes });
      return publicIngredient(updated);
    },
    deletePersonalIngredient: async ({ actor, params }) => {
      const userId = owner(actor);
      const before = await getOwned(userId, params.id);
      const updated = await repository.updateOne(
        { _id: before._id, userId },
        { $set: { status: "inactive" } },
      );
      return publicIngredient(updated);
    },
  };

  return {
    operations,
    publicService: { createForUser, getOwned },
  };
}
