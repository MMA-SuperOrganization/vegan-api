import mongoose from "mongoose";
import {
  CLIENT_PLATFORMS,
  USER_ROLES,
  USER_STATUSES,
  GENDERS,
  DIET_TYPES,
} from "../../common/constants/enums/identity.enums.js";

const { Schema } = mongoose;
const tokenSchema = new Schema(
  {
    tokenId: { type: String, required: true },
    token: { type: String, required: true },
    platform: { type: String, enum: CLIENT_PLATFORMS.values(), default: CLIENT_PLATFORMS.ANDROID },
    deviceName: String,
    lastUsedAt: Date,
  },
  { _id: false },
);
const schema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: { sparse: true } },
    displayName: { type: String, trim: true, maxlength: 100 },
    avatarUrl: String,
    avatarMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null, index: true },
    role: { type: String, enum: USER_ROLES.values(), default: USER_ROLES.USER, required: true },
    status: {
      type: String,
      enum: USER_STATUSES.values(),
      default: USER_STATUSES.ACTIVE,
      required: true,
    },
    onboardingCompleted: { type: Boolean, default: false },
    fcmTokens: { type: [tokenSchema], default: [], select: false },
    fcmTokensVersion: { type: Number, default: 0, select: false },
    lastLoginAt: Date,
    deletedAt: Date,
  },
  { timestamps: true, versionKey: false, collection: "users" },
);
schema.index({ role: 1, status: 1 });
schema.index(
  { "fcmTokens.token": 1 },
  { unique: true, partialFilterExpression: { "fcmTokens.token": { $exists: true } } },
);
schema.set("toJSON", {
  transform(_doc, value) {
    delete value.fcmTokens;
    return value;
  },
});
export const UsersModel = mongoose.models.Users || mongoose.model("Users", schema);

const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true, unique: true },
    bio: { type: String, maxlength: 500, trim: true },
    username: { type: String, trim: true, lowercase: true, minlength: 3, maxlength: 30 },
    city: { type: String, trim: true, maxlength: 100 },
    country: { type: String, trim: true, maxlength: 100 },
    dateOfBirth: Date,
    gender: { type: String, enum: GENDERS.values() },
    dietType: {
      type: String,
      enum: DIET_TYPES.values(),
    },
    preferredCuisines: [String],
    dislikedFoodItemIds: [{ type: Schema.Types.ObjectId, ref: "FoodItems" }],
    preferredFoodItemIds: [{ type: Schema.Types.ObjectId, ref: "FoodItems" }],
    excludedFoodItemIds: [{ type: Schema.Types.ObjectId, ref: "FoodItems" }],
    locale: String,
    timezone: String,
  },
  { timestamps: true, versionKey: false, collection: "userProfiles" },
);
profileSchema.index(
  { username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: "string" } } },
);
export const UserProfilesModel =
  mongoose.models.UserProfiles || mongoose.model("UserProfiles", profileSchema);
const guardSchema = new Schema(
  { _id: String, version: { type: Number, default: 0 } },
  { versionKey: false, collection: "adminguards" },
);
export const AdminGuardsModel =
  mongoose.models.AdminGuards || mongoose.model("AdminGuards", guardSchema);
