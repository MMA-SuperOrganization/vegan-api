import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createAiValidation = () => ({
  getAiConversations: {
    query: paginationSchema.passthrough(),
  },
  createAiConversation: {
    body: z.object({}).passthrough(),
  },
  getAiMessages: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    query: paginationSchema.passthrough(),
  },
  sendAiMessage: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  createMealPlanProposal: {
    body: z.object({}).passthrough(),
  },
  confirmMealPlanProposal: {
    body: z.object({}).passthrough(),
  },
  recognizeIngredients: {
    body: z.object({}).passthrough(),
  },
  confirmPantryProposal: {
    body: z.object({}).passthrough(),
  },
  generateVideoSummary: {
    body: z.object({}).passthrough(),
  },
  submitAiFeedback: {
    body: z.object({}).passthrough(),
  },
});
