import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    weightKg: { type: Number, required: true, min: Number.EPSILON, max: 500 },
    recordedAt: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 1000 },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: "weightlogs" },
);
schema.index({ userId: 1, recordedAt: -1 });
export const WeightLogsModel = mongoose.models.WeightLogs ?? mongoose.model("WeightLogs", schema);
