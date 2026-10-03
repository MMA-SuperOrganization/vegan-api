import mongoose from "mongoose";
import { NUTRIENT_KEYS } from "../../common/utils/nutrition.js";
import { UNITS } from "../../common/utils/units.js";
const nutrition = new mongoose.Schema(
  Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, { type: Number, default: 0, min: 0 }])),
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    date: { type: Date, required: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
    sourceType: { type: String, enum: ["recipe", "food", "custom"], required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipes" },
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItems" },
    nameSnapshot: { type: String, required: true, trim: true, maxlength: 200 },
    servings: { type: Number, min: Number.EPSILON, max: 100 },
    quantity: { type: Number, min: Number.EPSILON, max: 1000000 },
    unit: { type: String, enum: UNITS },
    nutritionSnapshot: { type: nutrition, required: true },
    nutritionBasis: { type: nutrition, required: true, select: false },
    basisQuantity: { type: Number, required: true, min: Number.EPSILON, select: false },
    basisUnit: { type: String, required: true, enum: UNITS, select: false },
    note: { type: String, trim: true, maxlength: 1000 },
    consumedAt: { type: Date, required: true },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "diaries" },
);
schema.index({ userId: 1, date: -1, consumedAt: -1 });
export const DiaryModel = mongoose.models.Diary ?? mongoose.model("Diary", schema);
