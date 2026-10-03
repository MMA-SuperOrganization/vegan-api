import pino from "pino";

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
    ...(nodeEnv === "development" && {
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
