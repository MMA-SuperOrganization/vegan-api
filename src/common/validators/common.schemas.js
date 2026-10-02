import { z } from 'zod';
import { objectIdSchema } from './object-id.schema.js';

export const objectId = objectIdSchema;
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});
