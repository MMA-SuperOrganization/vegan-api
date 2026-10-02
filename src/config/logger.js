import pino from "pino";

/**
 * Tạo root logger. Development dùng pino-pretty (devDependency); môi trường khác log JSON.
 * @param {{ logLevel: string, nodeEnv: string }} env
 */
export const createLogger = ({ logLevel, nodeEnv }) =>
  pino({
    level: logLevel,
    base: { service: "vegan-api-mma302", env: nodeEnv },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']"],
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
