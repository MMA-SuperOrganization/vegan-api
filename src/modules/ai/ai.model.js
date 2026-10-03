import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model) => ({ type: Schema.Types.ObjectId, ref: model, required: true });
const options = (collection) => ({ collection, timestamps: true, versionKey: false });
const register = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
const conversation = new Schema(
  {
    userId: ref("Users"),
    title: { type: String, required: true, maxlength: 160 },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    lastMessageAt: Date,
  },
  options("aiConversations"),
);
conversation.index({ userId: 1, lastMessageAt: -1 });
const message = new Schema(
  {
    conversationId: ref("AiConversation"),
    userId: ref("Users"),
    aiRunId: { type: Schema.Types.ObjectId, ref: "AiRun" },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, maxlength: 10000 },
    structuredData: Schema.Types.Mixed,
    model: String,
    usage: Schema.Types.Mixed,
    status: { type: String, enum: ["completed", "failed", "blocked"], default: "completed" },
  },
  options("aiMessages"),
);
message.index({ conversationId: 1, userId: 1, createdAt: 1 });
const run = new Schema(
  {
    userId: ref("Users"),
    feature: {
      type: String,
      enum: ["chat", "meal_plan", "ingredient_recognition", "video_summary"],
      required: true,
    },
    provider: String,
    model: String,
    status: { type: String, enum: ["pending", "completed", "failed", "blocked"], required: true },
    latencyMs: Number,
    tokenUsage: Schema.Types.Mixed,
    estimatedCost: Number,
    inputMetadata: Schema.Types.Mixed,
    outputMetadata: Schema.Types.Mixed,
    errorCode: String,
  },
  options("aiRuns"),
);
run.index({ userId: 1, createdAt: -1 });
run.index({ feature: 1, status: 1, createdAt: -1 });
const feedback = new Schema(
  {
    userId: ref("Users"),
    aiRunId: ref("AiRun"),
    rating: { type: String, enum: ["helpful", "not_helpful"], required: true },
    reason: { type: String, maxlength: 300 },
    comment: { type: String, maxlength: 2000 },
  },
  options("aiFeedback"),
);
feedback.index({ userId: 1, aiRunId: 1 }, { unique: true });
const proposal = new Schema(
  {
    userId: ref("Users"),
    aiRunId: ref("AiRun"),
    type: { type: String, enum: ["meal_plan", "pantry"], required: true },
    status: { type: String, enum: ["pending", "confirmed"], default: "pending" },
    structuredData: { type: Schema.Types.Mixed, required: true },
    startDate: String,
    expiresAt: { type: Date, required: true },
    confirmedAt: Date,
    result: Schema.Types.Mixed,
  },
  options("aiProposals"),
);
proposal.index({ userId: 1, status: 1, expiresAt: 1 });
// No TTL deletion: retaining consumed proposals makes retries idempotent after expiry.
export const AiConversationModel = register("AiConversation", conversation);
export const AiMessageModel = register("AiMessage", message);
export const AiRunModel = register("AiRun", run);
export const AiFeedbackModel = register("AiFeedback", feedback);
export const AiProposalModel = register("AiProposal", proposal);
export const aiModels = {
  aiConversations: AiConversationModel,
  aiMessages: AiMessageModel,
  aiRuns: AiRunModel,
  aiFeedback: AiFeedbackModel,
  aiProposals: AiProposalModel,
};
