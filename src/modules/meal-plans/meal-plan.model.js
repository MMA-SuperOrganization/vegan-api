import mongoose from "mongoose";
const mealPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekStartDate: Date,
    title: String,
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
    days: [
      {
        date: Date,
        meals: [
          {
            mealId: { type: String, required: true },
            type: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"] },
            recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
            recipeSnapshot: String,
            servings: Number,
            note: String,
            completed: { type: Boolean, default: false },
          },
        ],
      },
    ],
    nutritionSummary: Object,
  },
  { timestamps: true, versionKey: false },
);
export const MealPlan = mongoose.models.MealPlan ?? mongoose.model("MealPlan", mealPlanSchema);
