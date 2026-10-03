import mongoose from "mongoose";

const READY_STATES = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
export const connectDatabase = async ({
  uri,
  dbName,
  minPoolSize = 1,
  maxPoolSize = 10,
  serverSelectionTimeoutMs = 10000,
  autoIndex = false,
  logger,
}) => {
  await mongoose.connect(uri, {
    dbName,
    minPoolSize,
    maxPoolSize,
    serverSelectionTimeoutMS: serverSelectionTimeoutMs,
    autoIndex,
  });
  logger.info({ database: mongoose.connection.name }, "MongoDB connected");
  return mongoose.connection;
};
export const disconnectDatabase = () => mongoose.disconnect();
export const getDatabaseStatus = () => READY_STATES[mongoose.connection.readyState] ?? "unknown";
