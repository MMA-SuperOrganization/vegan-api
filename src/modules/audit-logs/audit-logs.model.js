import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    actorId: String,
    actorRole: String,
    action: String,
    targetType: String,
    targetId: String,
    before: {},
    after: {},
    requestId: String,
    ipHash: String,
  },
  { timestamps: true, versionKey: false },
);

export const AuditLogsModel = mongoose.model("AuditLogs", schema);
