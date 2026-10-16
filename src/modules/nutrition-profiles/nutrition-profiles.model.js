import mongoose from "mongoose";
import {
  ACTIVITY_LEVELS,
  NUTRITION_GOALS,
  TDEE_SOURCES,
} from "../../common/constants/enums/planning.enums.js";

const { Schema } = mongoose;
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true, unique: true },
    heightCm: { type: Number, min: 50, max: 250 },
    currentWeightKg: { type: Number, min: 10, max: 500 },
    activityLevel: {
      type: String,
      enum: ACTIVITY_LEVELS.values(),
    },
    goal: { type: String, enum: NUTRITION_GOALS.values() },
    dailyCalorieTarget: Number,
    proteinTargetG: Number,
    carbTargetG: Number,
    fatTargetG: Number,
    fiberTargetG: Number,
    waterTargetMl: Number,
    allergenIds: [{ type: Schema.Types.ObjectId, ref: "Allergens" }],
    allergenSelectionCompleted: { type: Boolean, default: false },
    medicalNotes: { type: String, maxlength: 2000 },
    bmi: Number,
    bmiCategory: String,
    calculatedAt: Date,
    targetSource: {
      type: String,
      enum: TDEE_SOURCES.values(),
      default: TDEE_SOURCES.INSUFFICIENT_DATA,
    },
    version: { type: Number, default: 0 },
    manualTargetFields: { type: [String], default: [] },
    calculationWarnings: [String],
  },
  { timestamps: true, versionKey: false, collection: "nutritionprofiles" },
);
schema.index({ allergenIds: 1 });
export const NutritionProfilesModel =
  mongoose.models.NutritionProfiles || mongoose.model("NutritionProfiles", schema);
