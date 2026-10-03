import { buildRepository } from "../../common/persistence/repository.js";
import { RemindersModel } from "./reminders.model.js";
export const createRemindersRepository = ({ repositories = {} } = {}) =>
  buildRepository({ repositories, key: "reminders", model: RemindersModel });
