import mongoose from "mongoose";
const groceryListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: String,
    sourceMealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlan" },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
    items: [
      {
        itemId: { type: String, required: true },
        foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem" },
        nameSnapshot: String,
        quantity: Number,
        unit: String,
        categorySnapshot: String,
        checked: { type: Boolean, default: false },
        note: String,
      },
    ],
  },
  { timestamps: true, versionKey: false },
);
export const GroceryList =
  mongoose.models.GroceryList ?? mongoose.model("GroceryList", groceryListSchema);
