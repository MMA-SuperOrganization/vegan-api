import mongoose from "mongoose";

const READY_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

/**
 * Kết nối MongoDB Atlas. Ném lỗi nếu không kết nối được để server fail fast.
 * @param {{ uri: string, autoIndex: boolean, logger: import("pino").Logger }} options
 */
export const connectDatabase = async ({ uri, autoIndex, logger }) => {
  // Chặn query selector injection (vd. { "$gt": "" }) từ dữ liệu người dùng.
  mongoose.set("sanitizeFilter", true);

  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
  mongoose.connection.on("error", (error) => logger.error({ err: error }, "MongoDB error"));

  await mongoose.connect(uri, {
    autoIndex,
    serverSelectionTimeoutMS: 10_000,
  });

  logger.info({ database: mongoose.connection.name }, "MongoDB connected");
  return mongoose.connection;
};

export const disconnectDatabase = () => mongoose.disconnect();

export const getDatabaseStatus = () => READY_STATES[mongoose.connection.readyState] ?? "unknown";
