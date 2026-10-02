import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createNotificationsValidation = () => ({
  getNotifications: {
    query: paginationSchema.passthrough(),
  },
  getUnreadNotificationCount: {
    query: paginationSchema.passthrough(),
  },
  markNotificationAsRead: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
    body: z.object({}).passthrough(),
  },
  markAllNotificationsAsRead: {
    body: z.object({}).passthrough(),
  },
  deleteNotification: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
  getNotificationPreferences: {
    query: paginationSchema.passthrough(),
  },
  upsertNotificationPreferences: {
    body: z.object({}).passthrough(),
  },
});
