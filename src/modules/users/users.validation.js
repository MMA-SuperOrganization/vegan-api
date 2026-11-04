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
import { GENDERS, USER_ROLES, USER_STATUSES } from "../../common/constants/enums/identity.enums.js";
import { CONTENT_STATUSES } from "../../common/constants/enums/content.enums.js";
import { VIEW_HISTORY_TARGET_TYPES } from "../../common/constants/enums/engagement.enums.js";

const optionalNonBlank = (schema) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema.optional(),
  );

export const profileSchema = z
  .object({
    bio: optionalNonBlank(text(500)),
    username: optionalNonBlank(
      text(30)
        .min(3)
        .regex(/^[a-zA-Z0-9_]+$/)
        .transform((value) => value.toLowerCase()),
    ),
    city: optionalNonBlank(text(100)),
    country: optionalNonBlank(text(100)),
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
    dateOfBirth: optionalNonBlank(
      z
        .union([dateOnly, dateTime])
        .refine((v) => new Date(v) <= new Date(), "Birth date cannot be in the future")
        .nullable(),
    ),
    gender: z.enum(GENDERS.values()).nullable().optional(),
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
    locale: optionalNonBlank(text(35).regex(/^[a-zA-Z]{2,3}(?:[-_][a-zA-Z0-9]{2,8})*$/)),
    timezone: optionalNonBlank(timezone),
    kitchenAutomation: z
      .object({
        autoDeductOnMealCompletion: z.boolean(),
        expiryTrackingEnabled: z.boolean(),
        expiryLeadDays: z.number().int().min(0).max(30),
        restockSuggestionsEnabled: z.boolean(),
        restockThresholdGrams: z.number().min(0).max(100000),
      })
      .strict()
      .optional(),
  })
  .strict()
  .transform((profile) =>
    Object.fromEntries(Object.entries(profile).filter(([, value]) => value !== undefined)),
  );
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
    body: profileSchema,
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
