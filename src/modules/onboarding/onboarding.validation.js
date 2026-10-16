import { z } from "zod";
import {
  dietTypes,
  id,
  positive,
  timezone,
  emptyBody,
} from "../../common/validators/domain.schemas.js";
import { NUTRITION_GOALS, ACTIVITY_LEVELS } from "../../common/constants/enums/planning.enums.js";
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
        goal: z.enum(NUTRITION_GOALS.values()).optional(),
        activityLevel: z.enum(ACTIVITY_LEVELS.values()).optional(),
        heightCm: positive(250).min(50).optional(),
        currentWeightKg: positive(500).min(10).optional(),
        timezone: timezone.optional(),
      })
      .strict()
      .refine((v) => Object.keys(v).length > 0, "At least one onboarding field is required"),
  },
  completeOnboarding: { body: emptyBody },
});
