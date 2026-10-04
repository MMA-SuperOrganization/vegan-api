import mongoose from "mongoose";

const { Schema } = mongoose;
const tokenSchema = new Schema(
  {
    tokenId: { type: String, required: true },
    token: { type: String, required: true },
    platform: { type: String, enum: ["android"], default: "android" },
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
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
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
    dateOfBirth: Date,
    gender: { type: String, enum: ["female", "male", "non_binary", "other", "prefer_not_to_say"] },
    dietType: {
      type: String,
      enum: [
        "vegan",
        "vegetarian",
        "lacto_vegetarian",
        "ovo_vegetarian",
        "lacto_ovo_vegetarian",
        "pescatarian",
        "flexitarian",
        "other",
      ],
    },
    preferredCuisines: [String],
    dislikedFoodItemIds: [{ type: Schema.Types.ObjectId, ref: "FoodItems" }],
    locale: String,
    timezone: String,
  },
  { timestamps: true, versionKey: false, collection: "userProfiles" },
);
export const UserProfilesModel =
  mongoose.models.UserProfiles || mongoose.model("UserProfiles", profileSchema);
const guardSchema = new Schema(
  { _id: String, version: { type: Number, default: 0 } },
  { versionKey: false, collection: "adminguards" },
);
export const AdminGuardsModel =
  mongoose.models.AdminGuards || mongoose.model("AdminGuards", guardSchema);
