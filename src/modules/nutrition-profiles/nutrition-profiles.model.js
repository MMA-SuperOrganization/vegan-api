import mongoose from "mongoose";
const { Schema } = mongoose;
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true, unique: true },
    heightCm: { type: Number, min: 50, max: 250 },
    currentWeightKg: { type: Number, min: 10, max: 500 },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
    },
    goal: { type: String, enum: ["lose_weight", "maintain", "gain_weight", "improve_nutrition"] },
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
      enum: ["user", "estimated", "insufficient_data"],
      default: "insufficient_data",
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
