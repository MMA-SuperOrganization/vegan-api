import mongoose from "mongoose";

export const imageAttributionSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, maxlength: 80 },
    sourceUrl: { type: String, required: true, maxlength: 2048 },
    author: { type: String, maxlength: 500 },
    license: { type: String, required: true, maxlength: 100 },
    licenseUrl: { type: String, maxlength: 2048 },
    retrievedAt: { type: Date, required: true },
  },
  { _id: false },
);
