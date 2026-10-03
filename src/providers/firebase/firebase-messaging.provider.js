import { getMessaging } from "firebase-admin/messaging";
import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { AppError } from "../../common/errors/app-error.js";
const invalidCodes = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);
/** Lazy Firebase adapter; construction never initializes credentials or calls a provider. */
export function createFirebaseMessagingProvider({ env = {}, messaging, app, logger } = {}) {
  const enabled = env.fcmEnabled === true;
  const timeoutMs = Math.min(60000, Math.max(1, env.fcmTimeoutMs || 30000));
  return {
    enabled,
    async send({ tokens, title, body, data = {} }) {
      if (!enabled) return { sent: 0, failed: 0, invalidTokens: [], skipped: true };
      const unique = [...new Set(tokens)]
        .filter((token) => typeof token === "string" && token.length > 0)
        .slice(0, 500);
      if (!unique.length) return { sent: 0, failed: 0, invalidTokens: [], skipped: true };
      try {
        let firebaseApp = app ?? getApps().find((value) => value.name === "vegan-api");
        if (!messaging && !firebaseApp) {
          const config = env.firebase ?? {};
          if (!config.projectId)
            throw AppError.serviceUnavailable("Push provider is not configured", "FCM_UNAVAILABLE");
          const credential =
            config.clientEmail && config.privateKey
              ? cert({
                  projectId: config.projectId,
                  clientEmail: config.clientEmail,
                  privateKey: config.privateKey,
                })
              : applicationDefault();
          firebaseApp = initializeApp({ credential, projectId: config.projectId }, "vegan-api");
        }
        const client = messaging ?? getMessaging(firebaseApp);
        let timer;
        let response;
        try {
          response = await Promise.race([
            client.sendEachForMulticast({
              tokens: unique,
              notification: { title, body },
              data: Object.fromEntries(
                Object.entries(data).map(([key, value]) => [
                  key,
                  typeof value === "string" ? value : JSON.stringify(value),
                ]),
              ),
            }),
            new Promise((_, reject) => {
              timer = setTimeout(
                () => reject(AppError.serviceUnavailable("Push delivery timed out", "FCM_TIMEOUT")),
                timeoutMs,
              );
            }),
          ]);
        } finally {
          clearTimeout(timer);
        }
        // Firebase does not expose AbortSignal for multicast. A timeout bounds our
        // worker, not provider acceptance; late acceptance remains at-least-once.
        const invalidTokens = response.responses.flatMap((entry, index) =>
          !entry.success && invalidCodes.has(entry.error?.code) ? [unique[index]] : [],
        );
        return { sent: response.successCount, failed: response.failureCount, invalidTokens };
      } catch (error) {
        if (error instanceof AppError) throw error;
        logger?.warn?.({ code: "FCM_SEND_FAILED" }, "Push delivery failed");
        throw AppError.serviceUnavailable(
          "Push delivery is temporarily unavailable",
          "FCM_SEND_FAILED",
        );
      }
    },
  };
}
