import { createUsersController } from "./users.controller.js";
import { buildRepository } from "../../common/persistence/repository.js";
import { UsersModel, UserProfilesModel, AdminGuardsModel } from "./users.model.js";
import { createUsersService } from "./users.service.js";
import { createUsersValidation } from "./users.validation.js";

const buildUsersModule = (deps) => {
  deps.repositories ??= {};
  const users = buildRepository({
    repositories: deps.repositories,
    key: "users",
    model: UsersModel,
  });
  const profiles = buildRepository({
    repositories: deps.repositories,
    key: "userProfiles",
    model: UserProfilesModel,
  });
  const guards = buildRepository({
    repositories: deps.repositories,
    key: "adminGuards",
    model: AdminGuardsModel,
  });
  const { operations, services } = createUsersService({ deps, users, profiles, guards });
  return {
    operations,
    validation: createUsersValidation(),
    services: { users: services },
    repositories: { users, userProfiles: profiles, adminGuards: guards },
    models: { users: UsersModel, userProfiles: UserProfilesModel, adminGuards: AdminGuardsModel },
  };
};
export { UsersModel, UserProfilesModel, AdminGuardsModel };

export const createUsersModule = (deps) => {
  const module = buildUsersModule(deps);
  return {
    ...module,
    controllers: createUsersController({ operations: module.operations, clock: deps.clock }),
  };
};
