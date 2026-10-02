import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    date: Date,
    mealType: String,
    sourceType: String,
    recipeId: String,
    foodItemId: String,
    nameSnapshot: String,
    servings: Number,
    quantity: Number,
    unit: String,
    nutritionSnapshot: {},
    note: String,
    consumedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

export const DiaryModel = mongoose.model("Diary", schema);
