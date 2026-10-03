import mongoose from "mongoose";
import { NUTRIENT_KEYS } from "../../common/utils/nutrition.js";
import { UNITS } from "../../common/utils/units.js";
const nutrition = new mongoose.Schema(
  Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, { type: Number, min: 0, default: 0 }])),
  { _id: false },
);
const ingredient = new mongoose.Schema(
  {
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItems", required: true },
    foodNameSnapshot: { type: String, trim: true },
    quantity: { type: Number, required: true, min: Number.EPSILON },
    unit: { type: String, enum: UNITS, required: true },
    gramEquivalent: { type: Number, min: Number.EPSILON },
    optional: Boolean,
  },
  { _id: false },
);
const recipeSnapshot = new mongoose.Schema(
  {
    title: { type: String, required: true },
    servings: { type: Number, required: true, min: Number.EPSILON },
    ingredients: { type: [ingredient], default: [] },
    nutritionPerServing: { type: nutrition, required: true },
  },
  { _id: false },
);
const meal = new mongoose.Schema(
  {
    mealId: { type: String, required: true },
    type: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipes", required: true },
    recipeSnapshot: { type: recipeSnapshot, required: true },
    servings: { type: Number, required: true, min: Number.EPSILON, max: 100 },
    note: { type: String, trim: true, maxlength: 1000 },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);
const day = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    meals: { type: [meal], default: [], validate: (value) => value.length <= 12 },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, index: true },
    weekStartDate: { type: Date, required: true },
    title: { type: String, trim: true, required: true, maxlength: 200 },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
    days: { type: [day], default: [], validate: (value) => value.length <= 7 },
    nutritionSummary: { type: nutrition, required: true },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "mealplans" },
);
// Active-plan uniqueness is serialized through a stable slot, not a partial index key
// that would need to be removed/reused by different documents within one transaction.
schema.index({ userId: 1, status: 1, weekStartDate: -1 });
export const MealPlansModel = mongoose.models.MealPlans ?? mongoose.model("MealPlans", schema);

const slotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    weekStartDate: { type: Date, required: true },
    activePlanId: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlans", default: null },
    version: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "mealplanactiveslots" },
);
slotSchema.index(
  { userId: 1, weekStartDate: 1 },
  { unique: true, name: "one_active_slot_per_owner_week" },
);
export const MealPlanActiveSlotsModel =
  mongoose.models.MealPlanActiveSlots ?? mongoose.model("MealPlanActiveSlots", slotSchema);
