import mongoose from "mongoose";
import {
  registerModel,
  contentFields,
  contentIndexes,
  ref,
  shortText,
  nutritionFields,
} from "../../common/persistence/content-model.js";
import { MEASUREMENT_UNITS } from "../../common/constants/enums/master-data.enums.js";
import {
  RECIPE_DIFFICULTIES,
  CONTENT_SOURCE_TYPES,
} from "../../common/constants/enums/content.enums.js";
import {
  catalogSourceSchema,
  nutritionDataQualityField,
} from "../../common/persistence/catalog-source.js";
import { imageAttributionSchema } from "../../common/persistence/image-attribution.js";

const ingredient = new mongoose.Schema(
  {
    foodItemId: ref("FoodItems", true),
    foodNameSnapshot: shortText(),
    nutritionPer100g: { type: new mongoose.Schema(nutritionFields, { _id: false }) },
    allergenIds: [ref("Allergens")],
    isVegan: Boolean,
    isVegetarian: Boolean,
    containsEggs: Boolean,
    containsDairy: Boolean,
    quantity: { type: Number, min: 0, required: true },
    unit: {
      type: String,
      enum: MEASUREMENT_UNITS.values(),
      required: true,
    },
    gramEquivalent: { type: Number, min: 0, required: true },
    note: shortText(500),
    optional: { type: Boolean, default: false },
    order: Number,
  },
  { _id: false },
);
const step = new mongoose.Schema(
  {
    order: { type: Number, required: true, min: 1 },
    instruction: { ...shortText(5000), required: true },
    mediaId: ref("Media"),
    timerSeconds: { type: Number, min: 0 },
  },
  { _id: false },
);
export const RecipesModel = registerModel(
  "Recipes",
  {
    ...contentFields,
    slug: { ...shortText(240), required: true, unique: true },
    summary: shortText(1000),
    description: shortText(10000),
    coverImageUrl: shortText(2048),
    coverImageObjectKey: { ...shortText(500), select: false },
    imageAttribution: { type: imageAttributionSchema },
    coverMediaId: ref("Media"),
    mediaIds: [ref("Media")],
    cuisine: shortText(100),
    servings: { type: Number, min: 1, max: 1000, default: 1 },
    prepMinutes: { type: Number, min: 0, default: 0 },
    cookMinutes: { type: Number, min: 0, default: 0 },
    totalMinutes: { type: Number, min: 0, default: 0 },
    difficulty: {
      type: String,
      enum: RECIPE_DIFFICULTIES.values(),
      default: RECIPE_DIFFICULTIES.EASY,
    },
    ingredients: [ingredient],
    steps: [step],
    nutritionPerServing: {
      type: new mongoose.Schema(nutritionFields, { _id: false }),
      default: () => ({}),
    },
    nutritionDataQuality: nutritionDataQualityField,
    sourceAttribution: { type: catalogSourceSchema },
    allergenIds: [ref("Allergens")],
    isVegan: Boolean,
    isVegetarian: Boolean,
    containsEggs: Boolean,
    containsDairy: Boolean,
    sourceType: {
      type: String,
      enum: CONTENT_SOURCE_TYPES.values(),
      default: CONTENT_SOURCE_TYPES.COMMUNITY,
    },
  },
  "recipes",
  [
    ...contentIndexes,
    [{ categoryIds: 1, status: 1 }],
    [{ tags: 1, status: 1 }],
    [{ "ingredients.foodItemId": 1, status: 1, visibility: 1, publishedAt: -1, _id: -1 }],
  ],
);
