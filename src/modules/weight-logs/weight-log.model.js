import mongoose from "mongoose";
const weightLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    weightKg: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now },
    note: String,
  },
  { timestamps: true, versionKey: false },
);
weightLogSchema.index({ userId: 1, recordedAt: -1 });
export const WeightLog = mongoose.models.WeightLog ?? mongoose.model("WeightLog", weightLogSchema);
