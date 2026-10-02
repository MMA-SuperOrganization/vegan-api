import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    weekStartDate: Date,
    title: String,
    status: String,
    days: [{}],
    nutritionSummary: {},
  },
  { timestamps: true, versionKey: false },
);

export const MealPlansModel = mongoose.model("MealPlans", schema);
