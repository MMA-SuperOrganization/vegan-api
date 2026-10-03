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
export const waterInput = z
  .object({
    amountMl: positive(10000),
    recordedAt: dateTime.optional(),
    note: text(1000, 0).optional(),
  })
  .strict();
const query = rangeQuery
  .extend({ date: dateOnly.optional(), timezone: timezone.default("UTC") })
  .strict()
  .refine((value) => !value.date || (!value.from && !value.to), "Use date or range, not both");
const params = z.object({ id }).strict();
export const createWaterLogsValidation = () => ({
  getWaterLogs: { query },
  createWaterLog: { body: waterInput },
  updateWaterLog: { params, body: patch(waterInput) },
  deleteWaterLog: { params },
});
