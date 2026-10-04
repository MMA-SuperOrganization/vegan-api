import { z } from "zod";
import {
  id,
  text,
  dateOnly,
  dateTime,
  dietTypes,
  pagination,
  patch,
  emptyBody,
  url,
  timezone,
} from "../../common/validators/domain.schemas.js";

export const profileSchema = z
  .object({
    bio: text(500, 0).optional(),
    dateOfBirth: z
      .union([dateOnly, dateTime])
      .refine((v) => new Date(v) <= new Date(), "Birth date cannot be in the future")
      .nullable()
      .optional(),
    gender: z
      .enum(["female", "male", "non_binary", "other", "prefer_not_to_say"])
      .nullable()
      .optional(),
    dietType: dietTypes.optional(),
    preferredCuisines: z
      .array(text(60))
      .max(20)
      .transform((v) => [...new Set(v)])
      .optional(),
    dislikedFoodItemIds: z
      .array(id)
      .max(50)
      .transform((v) => [...new Set(v)])
      .optional(),
    locale: text(35)
      .regex(/^[a-zA-Z]{2,3}(?:[-_][a-zA-Z0-9]{2,8})*$/)
      .optional(),
    timezone: timezone.optional(),
  })
  .strict();
export const updateMeBodySchema = patch(
  z.object({ displayName: text(100), avatarMediaId: id.nullable(), avatarUrl: z.null() }),
).refine(
  (body) => !(Object.hasOwn(body, "avatarMediaId") && Object.hasOwn(body, "avatarUrl")),
  "Use avatarMediaId, or avatarUrl:null to clear a legacy avatar",
);
const idParams = z.object({ id }).strict();
export const createUsersValidation = () => ({
  getMyProfileSummary: {},
  updateMyProfile: { body: updateMeBodySchema },
  deleteMyAccount: { body: emptyBody },
  getPublicUserProfile: { params: z.object({ userId: id }).strict() },
  getMyContent: {
    query: pagination
      .extend({
        type: z.enum(["recipe", "post", "video"]).default("recipe"),
        status: z
          .enum([
            "draft",
            "pending_review",
            "published",
            "rejected",
            "hidden",
            "deleted",
            "processing",
          ])
          .optional(),
      })
      .strict(),
  },
  getMyActivity: {},
  getMyFullProfile: {},
  upsertMyProfile: {
    body: profileSchema.refine(
      (v) => Object.keys(v).length > 0,
      "At least one profile field is required",
    ),
  },
  suspendUser: { params: idParams, body: z.object({ reason: text(500).optional() }).strict() },
  activateUser: { params: idParams, body: emptyBody },
  getAdminUsers: {
    query: pagination
      .extend({
        q: text(100).optional(),
        status: z.enum(["active", "suspended", "deleted"]).optional(),
        role: z.enum(["user", "admin"]).optional(),
      })
      .strict(),
  },
  getAdminUserDetail: { params: idParams },
  changeUserRole: {
    params: idParams,
    body: z.object({ role: z.enum(["user", "admin"]) }).strict(),
  },
});
