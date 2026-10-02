// Dùng chung bởi users (model) và middleware authorize (mọi module có route quản trị).
export const ROLES = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));
