import { createFirebaseAuth } from "./config/firebase.js";
import { createR2Client } from "./config/r2.js";
import { getDatabaseStatus } from "./config/database.js";
import { createFirebaseAuthProvider } from "./providers/firebase/firebase-auth.provider.js";
import { createR2StorageProvider } from "./providers/r2/r2-storage.provider.js";
import { createAiProvider } from "./providers/ai/ai.provider.js";
import { createFirebaseMessagingProvider } from "./providers/firebase/firebase-messaging.provider.js";
import { createTransaction } from "./common/persistence/repository.js";
import { createAuthGuards } from "./common/middlewares/auth-guards.js";
import { createRateLimiter } from "./common/middlewares/rate-limit.js";
import { createHealthModule } from "./modules/health/index.js";
import { createAuditLogsModule } from "./modules/audit-logs/index.js";
import { createUsersModule } from "./modules/users/index.js";
import { createAuthModule } from "./modules/auth/index.js";
import { createNutritionProfilesModule } from "./modules/nutrition-profiles/index.js";
import { createOnboardingModule } from "./modules/onboarding/index.js";
import { createCategoriesModule } from "./modules/categories/index.js";
import { createAllergensModule } from "./modules/allergens/index.js";
import { createFoodItemsModule } from "./modules/food-items/index.js";
import { createMediaModule } from "./modules/media/index.js";
import { createRecipesModule } from "./modules/recipes/index.js";
import { createPostsModule } from "./modules/posts/index.js";
import { createVideosModule } from "./modules/videos/index.js";
import { createCommentsModule } from "./modules/comments/index.js";
import { createReactionsModule } from "./modules/reactions/index.js";
import { createRatingsModule } from "./modules/ratings/index.js";
import { createSavedItemsModule } from "./modules/saved-items/index.js";
import { createViewHistoryModule } from "./modules/view-history/index.js";
import { createPantriesModule } from "./modules/pantries/index.js";
import { createMealPlansModule } from "./modules/meal-plans/index.js";
import { createGroceryListsModule } from "./modules/grocery-lists/index.js";
import { createDiaryModule } from "./modules/diary/index.js";
import { createWeightLogsModule } from "./modules/weight-logs/index.js";
import { createWaterLogsModule } from "./modules/water-logs/index.js";
import { createAiModule } from "./modules/ai/index.js";
import { createNotificationsModule } from "./modules/notifications/index.js";
import { createRemindersModule } from "./modules/reminders/index.js";
import { createAppConfigModule } from "./modules/app-config/index.js";
import { createHomeModule } from "./modules/home/index.js";
import { createSearchModule } from "./modules/search/index.js";
import { createRecommendationsModule } from "./modules/recommendations/index.js";
import { createReportsModule } from "./modules/reports/index.js";
import { createModerationModule } from "./modules/moderation/index.js";
import { createAdminDashboardModule } from "./modules/admin-dashboard/index.js";
import { createAiMonitoringModule } from "./modules/ai-monitoring/index.js";

const FACTORIES = [
  createAuditLogsModule,
  createUsersModule,
  createAuthModule,
  createNutritionProfilesModule,
  createOnboardingModule,
  createCategoriesModule,
  createAllergensModule,
  createFoodItemsModule,
  createMediaModule,
  createRecipesModule,
  createPostsModule,
  createVideosModule,
  createCommentsModule,
  createReactionsModule,
  createRatingsModule,
  createSavedItemsModule,
  createViewHistoryModule,
  createPantriesModule,
  createMealPlansModule,
  createGroceryListsModule,
  createDiaryModule,
  createWeightLogsModule,
  createWaterLogsModule,
  createAiModule,
  createNotificationsModule,
  createRemindersModule,
  createAppConfigModule,
  createHomeModule,
  createSearchModule,
  createRecommendationsModule,
  createReportsModule,
  createModerationModule,
  createAdminDashboardModule,
  createAiMonitoringModule,
  createHealthModule,
];
const dependency = (overrides, key, factory) =>
  Object.hasOwn(overrides, key) ? overrides[key] : factory();
export const createContainer = ({ env, logger, overrides = {} }) => {
  const authProvider = dependency(overrides, "authProvider", () =>
    env.firebase.enabled
      ? createFirebaseAuthProvider({ firebaseAuth: createFirebaseAuth(env.firebase) })
      : null,
  );
  const storageProvider = dependency(overrides, "storageProvider", () =>
    env.r2.enabled
      ? createR2StorageProvider({
          s3Client: createR2Client(env.r2),
          bucketName: env.r2.bucketName,
          publicBaseUrl: undefined,
          defaultExpiresIn: env.r2.presignedUrlExpiresIn,
        })
      : null,
  );
  const aiProvider = dependency(overrides, "aiProvider", () => createAiProvider({ env, logger }));
  const messagingProvider = dependency(overrides, "messagingProvider", () =>
    createFirebaseMessagingProvider({ env, logger }),
  );
  const repositories = { ...overrides.repositories };
  if (overrides.userRepository) repositories.users = overrides.userRepository;
  const services = {};
  const clock = overrides.clock ?? (() => new Date());
  const deps = {
    env,
    logger,
    repositories,
    services,
    clock,
    transaction: overrides.transaction ?? createTransaction(),
    authProvider,
    storageProvider,
    aiProvider,
    messagingProvider,
    getDatabaseStatus: overrides.getDatabaseStatus ?? getDatabaseStatus,
  };
  const controllers = {};
  const operations = {},
    validation = {},
    models = {},
    modules = [];
  for (const factory of FACTORIES) {
    deps.audit = services.audit;
    const module = factory(deps);
    modules.push(module);
    for (const key of Object.keys(module.operations))
      if (operations[key]) throw new Error(`Duplicate operation: ${key}`);
    Object.assign(operations, module.operations);
    Object.assign(controllers, module.controllers);
    Object.assign(validation, module.validation);
    Object.assign(services, module.services);
    Object.assign(models, module.models);
  }
  const limits = env.rateLimits;
  return {
    ...deps,
    modules,
    models,
    operations,
    controllers,
    validation,
    services,
    repositories,
    providers: {
      auth: authProvider,
      storage: storageProvider,
      ai: aiProvider,
      messaging: messagingProvider,
    },
    auth: createAuthGuards({ authProvider, usersService: services.users }),
    apiRateLimiter: dependency(overrides, "apiRateLimiter", () =>
      createRateLimiter({ windowMs: limits.windowMs, limit: limits.max }),
    ),
    authRateLimiter: dependency(overrides, "authRateLimiter", () =>
      createRateLimiter({ windowMs: limits.windowMs, limit: limits.authMax }),
    ),
    uploadRateLimiter: dependency(overrides, "uploadRateLimiter", () =>
      createRateLimiter({ windowMs: limits.windowMs, limit: limits.uploadMax }),
    ),
    aiRateLimiter: dependency(overrides, "aiRateLimiter", () =>
      createRateLimiter({ windowMs: limits.windowMs, limit: limits.aiMax }),
    ),
  };
};
