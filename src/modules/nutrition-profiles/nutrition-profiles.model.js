import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: String, unique: true },
    heightCm: Number,
    currentWeightKg: Number,
    activityLevel: String,
    goal: String,
    dailyCalorieTarget: Number,
    proteinTargetG: Number,
    carbTargetG: Number,
    fatTargetG: Number,
    fiberTargetG: Number,
    waterTargetMl: Number,
    allergenIds: [String],
    medicalNotes: String,
    bmi: Number,
    bmiCategory: String,
    calculatedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

export const NutritionProfilesModel = mongoose.model("NutritionProfiles", schema);
