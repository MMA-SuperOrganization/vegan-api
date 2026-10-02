import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createOnboardingValidation = () => ({
  getOnboardingStatus: {
    query: paginationSchema.passthrough(),
  },
  updateOnboarding: {
    body: z.object({}).passthrough(),
  },
  completeOnboarding: {
    body: z.object({}).passthrough(),
  },
});
