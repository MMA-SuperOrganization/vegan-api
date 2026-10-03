import { createRemindersRepository } from "./reminders.repository.js";
import { createRemindersService } from "./reminders.service.js";
import { createRemindersValidation } from "./reminders.validation.js";
import { reminderModels } from "./reminders.model.js";
export function createRemindersModule(deps = {}) {
  const repository = createRemindersRepository(deps);
  const service = createRemindersService({ ...deps, remindersRepository: repository });
  const validation = createRemindersValidation();
  const publicValue = (value) => {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(publicValue);
    if (value.data && value.meta) return { ...value, data: value.data.map(publicValue) };
    const { lockedAt, lockedBy, lockExpiresAt, claimKey, failureCode, ...safe } = value;
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
    services: { reminders: service },
    models: reminderModels,
    repositories: { reminders: repository },
  };
}
export { createRemindersService, createRemindersValidation, createRemindersRepository };
export * from "./reminders.model.js";
export { nextReminderRun } from "./reminder-schedule.js";
