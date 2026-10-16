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
import {
  GENDERS,
  USER_ROLES,
  USER_STATUSES,
} from "../../common/constants/enums/identity.enums.js";
import { CONTENT_STATUSES } from "../../common/constants/enums/content.enums.js";
import { VIEW_HISTORY_TARGET_TYPES } from "../../common/constants/enums/engagement.enums.js";

export const profileSchema = z
  .object({
    bio: text(500, 0).optional(),
    username: text(30)
      .min(3)
      .regex(/^[a-zA-Z0-9_]+$/)
      .transform((value) => value.toLowerCase())
      .optional(),
    city: text(100, 0).optional(),
    country: text(100, 0).optional(),
    preferredFoodItemIds: z
      .array(id)
      .max(50)
      .transform((values) => [...new Set(values)])
      .optional(),
    excludedFoodItemIds: z
      .array(id)
      .max(50)
      .transform((values) => [...new Set(values)])
      .optional(),
    dateOfBirth: z
      .union([dateOnly, dateTime])
      .refine((v) => new Date(v) <= new Date(), "Birth date cannot be in the future")
      .nullable()
      .optional(),
    gender: z
      .enum(GENDERS.values())
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
        type: z.enum(VIEW_HISTORY_TARGET_TYPES.values()).default(VIEW_HISTORY_TARGET_TYPES.RECIPE),
        status: z.enum(CONTENT_STATUSES.values()).optional(),
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
        status: z.enum(USER_STATUSES.values()).optional(),
        role: z.enum(USER_ROLES.values()).optional(),
      })
      .strict(),
  },
  getAdminUserDetail: { params: idParams },
  changeUserRole: {
    params: idParams,
    body: z.object({ role: z.enum(USER_ROLES.values()) }).strict(),
  },
});
