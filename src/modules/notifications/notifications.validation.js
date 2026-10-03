import { z } from "zod";
const id = z.string().regex(/^[a-f\d]{24}$/i);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const timezoneSchema = z
  .string()
  .min(1)
  .max(80)
  .refine((zone) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: zone });
      return true;
    } catch {
      return false;
    }
  }, "Invalid IANA timezone");
export const preferencesSchema = z.strictObject({
  pushEnabled: z.boolean().default(true),
  mealReminderEnabled: z.boolean().default(true),
  waterReminderEnabled: z.boolean().default(true),
  contentEnabled: z.boolean().default(true),
  quietHours: z
    .strictObject({
      enabled: z.boolean().default(false),
      start: time.default("22:00"),
      end: time.default("07:00"),
    })
    .default({ enabled: false, start: "22:00", end: "07:00" }),
  timezone: timezoneSchema.default("UTC"),
});
export const createNotificationsValidation = () => ({
  getNotifications: {
    query: z.strictObject({
      page: z.coerce.number().int().min(1).max(100000).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      unread: z.enum(["true", "false"]).optional(),
    }),
  },
  getUnreadNotificationCount: {},
  markNotificationAsRead: { params: z.strictObject({ id }), body: z.strictObject({}) },
  markAllNotificationsAsRead: { body: z.strictObject({}) },
  deleteNotification: { params: z.strictObject({ id }) },
  getNotificationPreferences: {},
  upsertNotificationPreferences: { body: preferencesSchema },
});
