import { AppError } from "../../common/errors/app-error.js";

const calculateBmi = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(2));
};

const getBmiCategory = (bmi) => {
  if (!bmi) return null;
  if (bmi < 18.5) return "underweight";
  if (bmi >= 18.5 && bmi < 25) return "normal";
  if (bmi >= 25 && bmi < 30) return "overweight";
  return "obese";
};

// Simplified dummy calculation for demonstration
const calculateTargets = (profile) => {
  if (!profile.currentWeightKg || !profile.heightCm) return {};

  const bmr = 10 * profile.currentWeightKg + 6.25 * profile.heightCm - 5 * 30 + 5; // Simplified Mifflin-St Jeor

  let multiplier = 1.2;
  if (profile.activityLevel === "light") multiplier = 1.375;
  if (profile.activityLevel === "moderate") multiplier = 1.55;
  if (profile.activityLevel === "active") multiplier = 1.725;
  if (profile.activityLevel === "very_active") multiplier = 1.9;

  let dailyCalorieTarget = Math.round(bmr * multiplier);

  if (profile.goal === "lose_weight") dailyCalorieTarget -= 500;
  if (profile.goal === "gain_weight") dailyCalorieTarget += 500;

  return {
    dailyCalorieTarget,
    proteinTargetG: Math.round((dailyCalorieTarget * 0.2) / 4),
    carbTargetG: Math.round((dailyCalorieTarget * 0.5) / 4),
    fatTargetG: Math.round((dailyCalorieTarget * 0.3) / 9),
    fiberTargetG: 30,
    waterTargetMl: profile.currentWeightKg * 35,
  };
};

export const createNutritionProfileService = ({ nutritionProfileRepository }) => {
  return {
    async getMyNutritionProfile(userId) {
      const profile = await nutritionProfileRepository.findByUserId(userId);
      return profile;
    },

    async upsertMyNutritionProfile(userId, profileData) {
      const bmi = calculateBmi(profileData.currentWeightKg, profileData.heightCm);
      const bmiCategory = getBmiCategory(bmi);

      const toUpdate = {
        ...profileData,
        ...(bmi ? { bmi, bmiCategory, calculatedAt: new Date() } : {}),
      };

      return nutritionProfileRepository.upsert(userId, toUpdate);
    },

    async recalculateNutritionTarget(userId) {
      const profile = await nutritionProfileRepository.findByUserId(userId);
      if (!profile) {
        throw AppError.badRequest("Please set height and weight first");
      }

      const targets = calculateTargets(profile);
      if (Object.keys(targets).length === 0) {
        throw AppError.badRequest("Missing height or weight for calculation");
      }

      return nutritionProfileRepository.upsert(userId, targets);
    },
  };
};
