import { NutritionProfile } from "./nutrition-profile.model.js";

export const createNutritionProfileRepository = () => {
  return {
    async findByUserId(userId) {
      return NutritionProfile.findOne({ userId }).lean();
    },

    async upsert(userId, profileData) {
      return NutritionProfile.findOneAndUpdate(
        { userId },
        { $set: profileData },
        { new: true, upsert: true },
      ).lean();
    },
  };
};
