import { readFileSync } from "node:fs";
import { z } from "zod";
import { AppError } from "../../common/errors/app-error.js";

const { version } = JSON.parse(
  readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
);

export const createHealthModule = ({
  env,
  clock,
  getDatabaseStatus,
  authProvider,
  storageProvider,
}) => ({
  operations: {
    checkLiveness: async () => ({
      app: env.appName,
      version,
      timestamp: clock().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    }),
    checkReadiness: async () => {
      const database = getDatabaseStatus();
      if (database !== "connected")
        throw AppError.serviceUnavailable("Database is not ready", "DATABASE_UNAVAILABLE");
      if (env.isProduction && (!authProvider || !storageProvider))
        throw AppError.serviceUnavailable(
          "Required providers are not configured",
          "PROVIDER_UNAVAILABLE",
        );
      return { status: "ready", database, timestamp: clock().toISOString() };
    },
  },
  validation: {
    checkLiveness: { query: z.object({}).strict() },
    checkReadiness: { query: z.object({}).strict() },
  },
  services: {},
  models: {},
});
