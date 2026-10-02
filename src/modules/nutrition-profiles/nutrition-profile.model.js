import mongoose from "mongoose";

const nutritionProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    heightCm: {
      type: Number,
      min: 0,
    },
    currentWeightKg: {
      type: Number,
      min: 0,
    },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
    },
    goal: {
      type: String,
      enum: ["lose_weight", "maintain", "gain_weight", "improve_nutrition"],
    },
    dailyCalorieTarget: {
      type: Number,
      min: 0,
    },
    proteinTargetG: {
      type: Number,
      min: 0,
    },
    carbTargetG: {
      type: Number,
      min: 0,
    },
    fatTargetG: {
      type: Number,
      min: 0,
    },
    fiberTargetG: {
      type: Number,
      min: 0,
    },
    waterTargetMl: {
      type: Number,
      min: 0,
    },
    allergenIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Allergen",
      },
    ],
    medicalNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    bmi: {
      type: Number,
    },
    bmiCategory: {
      type: String,
    },
    calculatedAt: {
      type: Date,
    },
  },
  {
    collection: "nutritionProfiles",
    timestamps: true,
    versionKey: false,
  },
);

export const NutritionProfile =
  mongoose.models.NutritionProfile ?? mongoose.model("NutritionProfile", nutritionProfileSchema);
