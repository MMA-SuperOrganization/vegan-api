import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      immutable: true,
    },
    actorRole: { type: String, enum: ["user", "admin", "system"], required: true, immutable: true },
    action: { type: String, required: true, maxlength: 100, immutable: true },
    targetType: { type: String, required: true, maxlength: 80, immutable: true },
    targetId: { type: String, required: true, maxlength: 100, immutable: true },
    before: { type: mongoose.Schema.Types.Mixed, immutable: true },
    after: { type: mongoose.Schema.Types.Mixed, immutable: true },
    requestId: { type: String, maxlength: 100, immutable: true },
    ipHash: { type: String, maxlength: 128, immutable: true },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false, collection: "auditlogs" },
);
schema.index({ createdAt: -1, _id: -1 });
schema.index({ actorId: 1, createdAt: -1 });
schema.index({ targetType: 1, targetId: 1, createdAt: -1 });
for (const operation of [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "replaceOne",
  "findOneAndReplace",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
]) {
  schema.pre(operation, function () {
    throw new Error("Audit logs are append-only");
  });
}
export const AuditLogsModel = mongoose.models.AuditLogs ?? mongoose.model("AuditLogs", schema);
