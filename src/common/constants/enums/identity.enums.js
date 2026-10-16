import { createEnum } from "./enum-factory.js";

export const USER_ROLES = createEnum({
  USER: "user",
  ADMIN: "admin",
});

export const USER_STATUSES = createEnum({
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DELETED: "deleted",
});

export const GENDERS = createEnum({
  FEMALE: "female",
  MALE: "male",
  NON_BINARY: "non_binary",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
});

export const DIET_TYPES = createEnum({
  VEGAN: "vegan",
  VEGETARIAN: "vegetarian",
  LACTO_VEGETARIAN: "lacto_vegetarian",
  OVO_VEGETARIAN: "ovo_vegetarian",
  LACTO_OVO_VEGETARIAN: "lacto_ovo_vegetarian",
  PESCATARIAN: "pescatarian",
  FLEXITARIAN: "flexitarian",
  OTHER: "other",
});

export const CLIENT_PLATFORMS = createEnum({
  ANDROID: "android",
});
