import { z } from 'zod';
import { objectId, paginationSchema } from '../../common/validators/common.schemas.js';

export const updateMeBodySchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9._]+$/)
      .refine(
        (v) => !v.startsWith(".") && !v.endsWith("."),
        "Username cannot start or end with a dot",
      )
      .optional(),
    displayName: z.string().trim().max(100).optional(),
    avatarUrl: z.string().trim().url().max(1024).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one updatable field is required",
  });

export const createUsersValidation = () => ({
  getMyProfileSummary: {},
  updateMyProfile: {
    body: updateMeBodySchema,
  },
  deleteMyAccount: {},
  getPublicUserProfile: {
    params: z.object({ idOrSlug: z.string() }),
  },
  getMyContent: {
    query: paginationSchema.passthrough(),
  },
  getMyActivity: {
    query: paginationSchema.passthrough(),
  },
  getMyFullProfile: {},
  upsertMyProfile: {
    body: z.object({
      bio: z.string().trim().max(500).optional(),
      dateOfBirth: z.string().datetime().optional(), // ISO 8601 string
      gender: z.string().trim().max(50).optional(),
      dietType: z
        .enum([
          "vegan",
          "vegetarian",
          "lacto_vegetarian",
          "ovo_vegetarian",
          "lacto_ovo_vegetarian",
          "pescatarian",
          "flexitarian",
          "other",
        ])
        .optional(),
      preferredCuisines: z.array(z.string().trim()).max(20).optional(),
      dislikedFoodItemIds: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"))
        .max(50)
        .optional(),
      locale: z.string().trim().max(10).optional(),
      timezone: z.string().trim().max(50).optional(),
    }).strict(),
  },
  suspendUser: {
    params: z.object({ id: z.string() }).passthrough(),
  },
  activateUser: {
    params: z.object({ id: z.string() }).passthrough(),
  },
  getAdminUsers: {
    query: paginationSchema.passthrough(),
  },
  getAdminUserDetail: {
    params: z.object({ id: z.string() }).passthrough(),
  },
  changeUserRole: {
    params: z.object({ id: z.string() }).passthrough(),
    body: z.object({
      role: z.enum(["USER", "ADMIN"])
    }).strict(),
  },
});

