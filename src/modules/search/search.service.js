import { z } from "zod";
import { dietTypes } from "../../common/validators/domain.schemas.js";
import {
  id,
  text,
  integer,
  pagination,
  empty,
  idParams,
  user,
  found,
  repository,
  publicFilter,
  escapeRegex,
  summarizeContent,
  now,
} from "../app-config/index.js";
const types = ["all", "recipe", "food-item", "post", "video"];
const boundedList = (schema) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.split(",").filter(Boolean) : value),
    z.array(schema).max(20),
  );
const filters = {
  q: text(120).optional(),
  type: z.enum(types).default("all"),
  category: id.optional(),
  cuisine: text(80).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  maxTotalMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  tags: boundedList(text(50)).optional(),
  excludeAllergenIds: boundedList(id).optional(),
  dietType: dietTypes.optional(),
  sort: z.enum(["newest", "oldest", "title", "popular"]).default("newest"),
};
export const searchValidation = {
  searchContent: {
    query: z.object({ ...filters, page: integer(20, 1), limit: integer(50, 20) }).strict(),
  },
  getSearchSuggestions: {
    query: z
      .object({ q: text(120), type: z.enum(types).default("all"), limit: integer(10, 8) })
      .strict(),
  },
  getRecentSearches: { query: z.object({ ...pagination, limit: integer(50, 20) }).strict() },
  clearRecentSearches: { query: empty },
  deleteRecentSearch: { params: idParams, query: empty },
};
const domains = { recipe: "recipes", post: "posts", video: "videos", "food-item": "foodItems" };
const sorting = (sort) =>
  sort === "oldest"
    ? { createdAt: 1, _id: 1 }
    : sort === "title"
      ? { title: 1, name: 1, _id: 1 }
      : sort === "popular"
        ? { viewCount: -1, createdAt: -1, _id: -1 }
        : { createdAt: -1, _id: -1 };
const makeFilter = (type, query) => {
  const filter = type === "food-item" ? { status: "active" } : { ...publicFilter };
  if (query.q) {
    const regex = { $regex: escapeRegex(query.q), $options: "i" };
    if (type === "food-item") filter.$or = [{ name: regex }, { aliases: regex }];
    else filter.title = regex;
  }
  if (query.category) filter[type === "food-item" ? "categoryId" : "categoryIds"] = query.category;
  if (query.excludeAllergenIds?.length) filter.allergenIds = { $nin: query.excludeAllergenIds };
  if (query.tags?.length && type !== "food-item") filter.tags = { $all: query.tags };
  if (type === "recipe") {
    if (query.cuisine) filter.cuisine = query.cuisine;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.maxTotalMinutes) filter.totalMinutes = { $lte: query.maxTotalMinutes };
    if (query.dietType === "vegan") filter.isVegan = true;
    else if (
      ["vegetarian", "lacto_vegetarian", "ovo_vegetarian", "lacto_ovo_vegetarian"].includes(
        query.dietType,
      )
    )
      filter.isVegetarian = true;
    else if (query.dietType) filter.dietTypes = query.dietType;
  }
  if (type === "food-item" && query.dietType === "vegan") filter.isVegan = true;
  if (
    type === "food-item" &&
    ["vegetarian", "lacto_vegetarian", "ovo_vegetarian", "lacto_ovo_vegetarian"].includes(
      query.dietType,
    )
  )
    filter.isVegetarian = true;
  return filter;
};
const summary = (item, type) =>
  type !== "food-item"
    ? { ...summarizeContent(item), type }
    : {
        _id: item._id,
        name: item.name,
        slug: item.slug,
        categoryId: item.categoryId,
        allergenIds: item.allergenIds,
        isVegan: item.isVegan,
        nutritionPer100g: item.nutritionPer100g,
        type,
        createdAt: item.createdAt,
      };
export const createSearchService = (deps, history) => {
  const selected = (type) => (type === "all" || !type ? Object.keys(domains) : [type]);
  const search = async (query) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const results = await Promise.all(
      selected(query.type).map(async (type) => {
        const result = await repository(deps, domains[type]).findMany(makeFilter(type, query), {
          page: 1,
          limit: page * limit,
          sort: sorting(query.sort),
        });
        return { items: result.data.map((item) => summary(item, type)), total: result.meta.total };
      }),
    );
    const items = results.flatMap((result) => result.items);
    items.sort((a, b) =>
      query.sort === "title"
        ? String(a.title ?? a.name).localeCompare(String(b.title ?? b.name)) ||
          String(a._id).localeCompare(String(b._id))
        : query.sort === "popular"
          ? (b.viewCount ?? 0) - (a.viewCount ?? 0) || String(b._id).localeCompare(String(a._id))
          : (new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0)) *
              (query.sort === "oldest" ? 1 : -1) ||
            (query.sort === "oldest"
              ? String(a._id).localeCompare(String(b._id))
              : String(b._id).localeCompare(String(a._id))),
    );
    const total = results.reduce((sum, result) => sum + result.total, 0);
    return {
      data: items.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  };
  return {
    async searchContent({ actor, query = {} }) {
      const result = await search(query);
      if (actor?.userId && query.q) {
        const userId = user(actor);
        const filter = {
          userId,
          normalizedQuery: query.q.trim().toLocaleLowerCase(),
          type: query.type ?? "all",
        };
        await history.updateOne(
          filter,
          { $set: { query: query.q.trim(), searchedAt: now(deps) }, $setOnInsert: filter },
          { upsert: true },
        );
        const overflow = await history.findMany(
          { userId },
          { page: 2, limit: 50, sort: { searchedAt: -1, _id: -1 } },
        );
        for (const item of overflow.data) await history.deleteOne({ _id: item._id, userId });
      }
      return result;
    },
    async getSearchSuggestions({ query }) {
      const result = await search({ ...query, page: 1, limit: query.limit ?? 8, sort: "title" });
      return result.data.map((item) => ({
        id: String(item._id),
        type: item.type,
        text: item.title ?? item.name,
        slug: item.slug,
      }));
    },
    async getRecentSearches({ actor, query = {} }) {
      return history.findMany(
        { userId: user(actor) },
        { page: query.page ?? 1, limit: query.limit ?? 20, sort: { searchedAt: -1, _id: -1 } },
      );
    },
    async clearRecentSearches({ actor }) {
      const userId = user(actor);
      let deletedCount = 0;
      while (true) {
        const batch = await history.findMany({ userId }, { page: 1, limit: 50 });
        if (!batch.data.length) break;
        for (const item of batch.data)
          if (await history.deleteOne({ _id: item._id, userId })) deletedCount += 1;
        if (batch.data.length < 50) break;
      }
      return { deletedCount };
    },
    async deleteRecentSearch({ actor, params }) {
      found(await history.deleteOne({ _id: params.id, userId: user(actor) }));
      return { deleted: true };
    },
  };
};
