import { buildRepository } from "../../common/persistence/repository.js";
import { notificationModels } from "./notifications.model.js";
export const createNotificationsRepository = ({ repositories = {} } = {}) =>
  Object.fromEntries(
    Object.entries(notificationModels).map(([key, model]) => [
      key,
      buildRepository({ repositories, key, model }),
    ]),
  );
