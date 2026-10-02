import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createRemindersValidation = () => ({
  getReminders: {
    query: paginationSchema.passthrough(),
  },
  createReminder: {
    body: z.object({}).passthrough(),
  },
  updateReminder: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  deleteReminder: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
});
