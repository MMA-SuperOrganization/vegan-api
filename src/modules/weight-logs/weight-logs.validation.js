import { z } from "zod";
import {
  id,
  text,
  positive,
  dateTime,
  dateOnly,
  rangeQuery,
  patch,
  timezone,
} from "../../common/validators/domain.schemas.js";
export const weightInput = z
  .object({
    weightKg: positive(500),
    recordedAt: dateTime.optional(),
    note: text(1000, 0).optional(),
  })
  .strict();
const query = rangeQuery
  .extend({ date: dateOnly.optional(), timezone: timezone.default("UTC") })
  .strict()
  .refine((value) => !value.date || (!value.from && !value.to), "Use date or range, not both");
const params = z.object({ id }).strict();
export const createWeightLogsValidation = () => ({
  getWeightLogs: { query },
  createWeightLog: { body: weightInput },
  updateWeightLog: { params, body: patch(weightInput) },
  deleteWeightLog: { params },
  getWeightTrend: { query },
});
