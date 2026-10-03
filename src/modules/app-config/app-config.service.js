import { z } from "zod";
import { dietTypes, units } from "../../common/validators/domain.schemas.js";
import { empty, service, found } from "./discovery-support.js";

export const appConfigValidation = {
  getAppConfig: { query: empty },
  bootstrapApp: { query: empty },
};
export const createAppConfigService = (deps) => {
  const config = () => {
    const input = deps.publicConfig ?? {};
    return {
      versionPolicy: {
        minimum:
          typeof input.minimumVersion === "string" ? input.minimumVersion.slice(0, 30) : "1.0.0",
        latest:
          typeof input.latestVersion === "string" ? input.latestVersion.slice(0, 30) : "1.0.0",
        forceUpdate: input.forceUpdate === true,
      },
      enums: {
        dietTypes: dietTypes.options,
        units: units.options,
        contentTypes: ["recipe", "post", "video"],
        reportReasons: ["spam", "harassment", "harmful", "misinformation", "copyright", "other"],
      },
      limits: { pageSize: 100, homeSectionSize: 10, searchSuggestions: 10, recentSearches: 50 },
      features: {
        ai: deps.env?.ai?.enabled === true || deps.env?.AI_ENABLED === true,
        videos: input.videosEnabled !== false,
        community: input.communityEnabled !== false,
      },
    };
  };
  return {
    async getAppConfig() {
      return config();
    },
    async bootstrapApp({ actor }) {
      const result = {
        config: config(),
        auth: { authenticated: false },
        onboarding: null,
        unreadCount: 0,
        masterDataVersions: { categories: "0", allergens: "0", foodItems: "0" },
      };
      for (const [domain, key] of [
        ["categories", "categories"],
        ["allergens", "allergens"],
        ["foodItems", "foodItems"],
      ]) {
        const repo = deps.repositories?.[domain];
        if (repo) {
          const latest = await repo.findOne(
            {},
            { sort: { updatedAt: -1, _id: -1 }, projection: { updatedAt: 1 } },
          );
          result.masterDataVersions[key] = latest?.updatedAt
            ? new Date(latest.updatedAt).toISOString()
            : "0";
        }
      }
      if (!actor?.userId) return result;
      const account = found(await service(deps, "users", "getById")(actor.userId));
      result.auth = {
        authenticated: true,
        user: {
          id: String(account._id ?? actor.userId),
          displayName: account.displayName,
          avatarMediaId: account.avatarMediaId,
          role: account.role,
          status: account.status,
        },
      };
      result.onboarding = await service(deps, "onboarding", "getStatus")(actor.userId);
      const count = await service(deps, "notifications", "unreadCount")(actor.userId);
      result.unreadCount =
        typeof count === "number" ? count : (count?.count ?? count?.unreadCount ?? 0);
      return result;
    },
  };
};
