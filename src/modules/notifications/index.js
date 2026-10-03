import { createNotificationsRepository } from "./notifications.repository.js";
import { createNotificationsService } from "./notifications.service.js";
import { createNotificationsValidation } from "./notifications.validation.js";
import { notificationModels } from "./notifications.model.js";
import { createFirebaseMessagingProvider } from "../../providers/firebase/firebase-messaging.provider.js";
export function createNotificationsModule(deps = {}) {
  const repositories = createNotificationsRepository(deps);
  const service = createNotificationsService({
    ...deps,
    notificationsRepository: repositories,
    messagingProvider:
      deps.messagingProvider ??
      createFirebaseMessagingProvider({ env: deps.env, logger: deps.logger }),
  });
  const validation = createNotificationsValidation();
  const publicValue = (value) => {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(publicValue);
    if (value.data && value.meta) return { ...value, data: value.data.map(publicValue) };
    const { pushLockedBy, pushLockExpiresAt, failureReason, ...safe } = value;
    return safe;
  };
  const operations = Object.fromEntries(
    Object.keys(validation).map((key) => [
      key,
      async (input) => publicValue(await service[key](input)),
    ]),
  );
  return {
    operations,
    validation,
    services: { notifications: service },
    models: notificationModels,
    repositories,
  };
}
export { createNotificationsService, createNotificationsValidation, createNotificationsRepository };
export * from "./notifications.model.js";
