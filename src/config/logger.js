import { createRequire } from "node:module";
import pino from "pino";

const require = createRequire(import.meta.url);

// pino-pretty is a devDependency; it is absent from production images built with --omit=dev.
const isPrettyAvailable = () => {
  try {
    require.resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
};

export const createLogger = ({ logLevel, nodeEnv, appName = "vegan-support-api" }) =>
  pino({
    level: logLevel,
    base: { service: appName, env: nodeEnv },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers['set-cookie']",
        "token",
        "apiKey",
        "privateKey",
        "medicalNotes",
        "fcmTokens",
        "*.token",
        "*.apiKey",
        "*.privateKey",
        "*.medicalNotes",
        "*.fcmTokens",
        "err.cause",
        "req.body",
      ],
      censor: "[REDACTED]",
    },
    ...(nodeEnv === "development" &&
      isPrettyAvailable() && {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname,service,env",
          },
        },
      }),
  });
