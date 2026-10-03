import { z } from "zod";
import {
  dietTypes,
  id,
  positive,
  timezone,
  emptyBody,
} from "../../common/validators/domain.schemas.js";
export const createOnboardingValidation = () => ({
  getOnboardingStatus: {},
  updateOnboarding: {
    body: z
      .object({
        dietType: dietTypes.optional(),
        allergenIds: z
          .array(id)
          .max(50)
          .transform((v) => [...new Set(v)])
          .optional(),
        goal: z.enum(["lose_weight", "maintain", "gain_weight", "improve_nutrition"]).optional(),
        activityLevel: z
          .enum(["sedentary", "light", "moderate", "active", "very_active"])
          .optional(),
        heightCm: positive(250).min(50).optional(),
        currentWeightKg: positive(500).min(10).optional(),
        timezone: timezone.optional(),
      })
      .strict()
      .refine((v) => Object.keys(v).length > 0, "At least one onboarding field is required"),
  },
  completeOnboarding: { body: emptyBody },
});
