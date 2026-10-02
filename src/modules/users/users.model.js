import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true }, email: { type: String, sparse: true }, displayName: String, avatarUrl: String, role: { type: String, enum: ["USER", "ADMIN"], default: "USER" }, status: { type: String, enum: ["ACTIVE", "SUSPENDED", "DELETED"], default: "ACTIVE" }, onboardingCompleted: { type: Boolean, default: false }, fcmTokens: [{}], lastLoginAt: Date, deletedAt: Date
}, { timestamps: true, versionKey: false });

export const UsersModel = mongoose.model('Users', schema);
