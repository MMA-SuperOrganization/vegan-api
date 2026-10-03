import mongoose from "mongoose";
import { UNITS } from "../../common/utils/units.js";
const item = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItems" },
    nameSnapshot: { type: String, trim: true, required: true, maxlength: 200 },
    quantity: { type: Number, required: true, min: Number.EPSILON, max: 1000000 },
    unit: { type: String, enum: UNITS, required: true },
    categorySnapshot: { type: String, trim: true },
    checked: { type: Boolean, default: false },
    note: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    name: { type: String, trim: true, required: true, maxlength: 200 },
    sourceMealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlans" },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
    items: { type: [item], default: [], validate: (value) => value.length <= 500 },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "grocerylists" },
);
schema.index({ userId: 1, status: 1, createdAt: -1 });
export const GroceryListsModel =
  mongoose.models.GroceryLists ?? mongoose.model("GroceryLists", schema);
