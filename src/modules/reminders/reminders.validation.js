import { z } from "zod";
import { timezoneSchema } from "../notifications/notifications.validation.js";
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const id = z.string().regex(/^[a-f\d]{24}$/i);
export const reminderScheduleSchema = z.discriminatedUnion("mode", [
  z.strictObject({
    mode: z.literal("once"),
    at: z.iso.datetime({ offset: true }),
    timezone: timezoneSchema.default("UTC"),
  }),
  z.strictObject({ mode: z.literal("daily"), at: time, timezone: timezoneSchema.default("UTC") }),
  z.strictObject({
    mode: z.literal("weekly"),
    at: time,
    timezone: timezoneSchema.default("UTC"),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((v) => new Set(v).size === v.length, "Duplicate weekdays"),
  }),
]);
const fields = {
  type: z.enum(["meal", "water", "custom"]),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000),
  schedule: reminderScheduleSchema,
};
export const createRemindersValidation = () => ({
  getReminders: {
    query: z.strictObject({
      page: z.coerce.number().int().min(1).max(100000).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
    }),
  },
  createReminder: { body: z.strictObject(fields) },
  updateReminder: {
    params: z.strictObject({ id }),
    body: z
      .strictObject({
        ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])),
        status: z.enum(["active", "paused"]).optional(),
      })
      .refine((v) => Object.keys(v).length > 0, "At least one field is required"),
  },
  deleteReminder: { params: z.strictObject({ id }) },
});
