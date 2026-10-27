import mongoose from "mongoose";

export const NUTRITION_DATA_QUALITIES = Object.freeze({
  VERIFIED: "verified",
  ESTIMATED: "estimated",
  UNAVAILABLE: "unavailable",
});

export const catalogSourceSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, maxlength: 80 },
    sourceId: { type: String, required: true, maxlength: 200 },
    url: { type: String, maxlength: 2048 },
    license: { type: String, required: true, maxlength: 100 },
    importedAt: { type: Date, required: true },
  },
  { _id: false },
);

export const nutritionDataQualityField = {
  type: String,
  enum: Object.values(NUTRITION_DATA_QUALITIES),
  default: NUTRITION_DATA_QUALITIES.UNAVAILABLE,
};
