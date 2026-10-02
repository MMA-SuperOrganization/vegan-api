import mongoose from "mongoose";
const waterLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amountMl: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now },
    note: String,
  },
  { timestamps: true, versionKey: false },
);
waterLogSchema.index({ userId: 1, recordedAt: -1 });
export const WaterLog = mongoose.models.WaterLog ?? mongoose.model("WaterLog", waterLogSchema);
