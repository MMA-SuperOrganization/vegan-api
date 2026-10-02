import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    title: String,
    status: String,
    lastMessageAt: Date,
    role: String,
    content: String,
    structuredData: {},
    model: String,
    usage: {},
    provider: String,
    latencyMs: Number,
    tokenUsage: Number,
    estimatedCost: Number,
    inputMetadata: {},
    outputMetadata: {},
    errorCode: String,
    createdAt: Date,
    feature: String,
    aiRunId: String,
    rating: String,
    reason: String,
    comment: String,
  },
  { timestamps: true, versionKey: false },
);

export const AiModel = mongoose.model("Ai", schema);
