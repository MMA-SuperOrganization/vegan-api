import { logger } from './config/logger.js';
import { env } from './config/env.js';
import { createFirebaseAuthProvider } from './providers/firebase/firebase-auth.provider.js';
import { createR2StorageProvider } from './providers/r2/r2-storage.provider.js';
import { createHealthController, createHealthService, createHealthRepository, createHealthValidation, HealthModel } from './modules/health/index.js';
import { createAppConfigController, createAppConfigService, createAppConfigRepository, createAppConfigValidation, AppConfigModel } from './modules/app-config/index.js';
import { createHomeController, createHomeService, createHomeRepository, createHomeValidation, HomeModel } from './modules/home/index.js';
import { createOnboardingController, createOnboardingService, createOnboardingRepository, createOnboardingValidation, OnboardingModel } from './modules/onboarding/index.js';
import { createAuthController, createAuthService, createAuthRepository, createAuthValidation, AuthModel } from './modules/auth/index.js';
import { createUsersController, createUsersService, createUsersRepository, createUsersValidation, UsersModel } from './modules/users/index.js';
import { createNutritionProfilesController, createNutritionProfilesService, createNutritionProfilesRepository, createNutritionProfilesValidation, NutritionProfilesModel } from './modules/nutrition-profiles/index.js';
import { setAuthDependencies } from './common/middlewares/auth-guards.js';

import { createCategoriesController, createCategoriesService, createCategoriesRepository, createCategoriesValidation, CategoriesModel } from './modules/categories/index.js';
import { createAllergensController, createAllergensService, createAllergensRepository, createAllergensValidation, AllergensModel } from './modules/allergens/index.js';
import { createFoodItemsController, createFoodItemsService, createFoodItemsRepository, createFoodItemsValidation, FoodItemsModel } from './modules/food-items/index.js';
import { createRecipesController, createRecipesService, createRecipesRepository, createRecipesValidation, RecipesModel } from './modules/recipes/index.js';
import { createSearchController, createSearchService, createSearchRepository, createSearchValidation, SearchModel } from './modules/search/index.js';
import { createRecommendationsController, createRecommendationsService, createRecommendationsRepository, createRecommendationsValidation, RecommendationsModel } from './modules/recommendations/index.js';
import { createPantriesController, createPantriesService, createPantriesRepository, createPantriesValidation, PantriesModel } from './modules/pantries/index.js';
import { createMealPlansController, createMealPlansService, createMealPlansRepository, createMealPlansValidation, MealPlansModel } from './modules/meal-plans/index.js';
import { createGroceryListsController, createGroceryListsService, createGroceryListsRepository, createGroceryListsValidation, GroceryListsModel } from './modules/grocery-lists/index.js';
import { createDiaryController, createDiaryService, createDiaryRepository, createDiaryValidation, DiaryModel } from './modules/diary/index.js';
import { createWeightLogsController, createWeightLogsService, createWeightLogsRepository, createWeightLogsValidation, WeightLogsModel } from './modules/weight-logs/index.js';
import { createWaterLogsController, createWaterLogsService, createWaterLogsRepository, createWaterLogsValidation, WaterLogsModel } from './modules/water-logs/index.js';
import { createMediaController, createMediaService, createMediaRepository, createMediaValidation, MediaModel } from './modules/media/index.js';
import { createPostsController, createPostsService, createPostsRepository, createPostsValidation, PostsModel } from './modules/posts/index.js';
import { createCommentsController, createCommentsService, createCommentsRepository, createCommentsValidation, CommentsModel } from './modules/comments/index.js';
import { createReactionsController, createReactionsService, createReactionsRepository, createReactionsValidation, ReactionsModel } from './modules/reactions/index.js';
import { createSavedItemsController, createSavedItemsService, createSavedItemsRepository, createSavedItemsValidation, SavedItemsModel } from './modules/saved-items/index.js';
import { createAiController, createAiService, createAiRepository, createAiValidation, AiModel } from './modules/ai/index.js';
import { createNotificationsController, createNotificationsService, createNotificationsRepository, createNotificationsValidation, NotificationsModel } from './modules/notifications/index.js';
import { createRemindersController, createRemindersService, createRemindersRepository, createRemindersValidation, RemindersModel } from './modules/reminders/index.js';
import { createReportsController, createReportsService, createReportsRepository, createReportsValidation, ReportsModel } from './modules/reports/index.js';
import { createModerationController, createModerationService, createModerationRepository, createModerationValidation, ModerationModel } from './modules/moderation/index.js';
import { createAuditLogsController, createAuditLogsService, createAuditLogsRepository, createAuditLogsValidation, AuditLogsModel } from './modules/audit-logs/index.js';
import { createVideosController, createVideosService, createVideosRepository, createVideosValidation, VideosModel } from './modules/videos/index.js';
import { createRatingsController, createRatingsService, createRatingsRepository, createRatingsValidation, RatingsModel } from './modules/ratings/index.js';
import { createViewHistoryController, createViewHistoryService, createViewHistoryRepository, createViewHistoryValidation, ViewHistoryModel } from './modules/view-history/index.js';
import { createAdminDashboardController, createAdminDashboardService, createAdminDashboardRepository, createAdminDashboardValidation, AdminDashboardModel } from './modules/admin-dashboard/index.js';
import { createAiMonitoringController, createAiMonitoringService, createAiMonitoringRepository, createAiMonitoringValidation, AiMonitoringModel } from './modules/ai-monitoring/index.js';

import mongoose from "mongoose";

export const createContainer = ({ env, logger, overrides = {} }) => {
  const providers = {
    firebaseAuth: overrides.authProvider || createFirebaseAuthProvider({ env, logger }),
    storage: createR2StorageProvider({ env, logger }),
  };

  const healthRepository = createHealthRepository({ HealthModel });
  const getDatabaseStatus = overrides.getDatabaseStatus || (() => mongoose.connection.readyState === 1 ? 'connected' : 'disconnected');
  const healthService = createHealthService({ healthRepository, getDatabaseStatus });
  const healthController = createHealthController({ healthService });
  const healthValidation = createHealthValidation();

  const appConfigRepository = createAppConfigRepository({ AppConfigModel });
  const appConfigService = createAppConfigService({ appConfigRepository });
  const appConfigController = createAppConfigController({ appConfigService });
  const appConfigValidation = createAppConfigValidation();

  const homeRepository = createHomeRepository({ HomeModel });
  const homeService = createHomeService({ homeRepository });
  const homeController = createHomeController({ homeService });
  const homeValidation = createHomeValidation();

  const onboardingRepository = createOnboardingRepository({ OnboardingModel });
  const onboardingService = createOnboardingService({ onboardingRepository });
  const onboardingController = createOnboardingController({ onboardingService });
  const onboardingValidation = createOnboardingValidation();

  const authRepository = createAuthRepository({ AuthModel });
  const authService = createAuthService({ authRepository });
  const authController = createAuthController({ authService });
  const authValidation = createAuthValidation();

  const usersRepository = overrides.userRepository || createUsersRepository({ UsersModel });
  const usersService = createUsersService({ usersRepository });
  const usersController = createUsersController({ usersService });
  const usersValidation = createUsersValidation();

  setAuthDependencies(providers.firebaseAuth, usersRepository);


  const nutritionProfilesRepository = createNutritionProfilesRepository({ NutritionProfilesModel });
  const nutritionProfilesService = createNutritionProfilesService({ nutritionProfilesRepository });
  const nutritionProfilesController = createNutritionProfilesController({ nutritionProfilesService });
  const nutritionProfilesValidation = createNutritionProfilesValidation();

  const categoriesRepository = createCategoriesRepository({ CategoriesModel });
  const categoriesService = createCategoriesService({ categoriesRepository });
  const categoriesController = createCategoriesController({ categoriesService });
  const categoriesValidation = createCategoriesValidation();

  const allergensRepository = createAllergensRepository({ AllergensModel });
  const allergensService = createAllergensService({ allergensRepository });
  const allergensController = createAllergensController({ allergensService });
  const allergensValidation = createAllergensValidation();

  const foodItemsRepository = createFoodItemsRepository({ FoodItemsModel });
  const foodItemsService = createFoodItemsService({ foodItemsRepository });
  const foodItemsController = createFoodItemsController({ foodItemsService });
  const foodItemsValidation = createFoodItemsValidation();

  const recipesRepository = createRecipesRepository({ RecipesModel });
  const recipesService = createRecipesService({ recipesRepository });
  const recipesController = createRecipesController({ recipesService });
  const recipesValidation = createRecipesValidation();

  const searchRepository = createSearchRepository({ SearchModel });
  const searchService = createSearchService({ searchRepository });
  const searchController = createSearchController({ searchService });
  const searchValidation = createSearchValidation();

  const recommendationsRepository = createRecommendationsRepository({ RecommendationsModel });
  const recommendationsService = createRecommendationsService({ recommendationsRepository });
  const recommendationsController = createRecommendationsController({ recommendationsService });
  const recommendationsValidation = createRecommendationsValidation();

  const pantriesRepository = createPantriesRepository({ PantriesModel });
  const pantriesService = createPantriesService({ pantriesRepository });
  const pantriesController = createPantriesController({ pantriesService });
  const pantriesValidation = createPantriesValidation();

  const mealPlansRepository = createMealPlansRepository({ MealPlansModel });
  const mealPlansService = createMealPlansService({ mealPlansRepository });
  const mealPlansController = createMealPlansController({ mealPlansService });
  const mealPlansValidation = createMealPlansValidation();

  const groceryListsRepository = createGroceryListsRepository({ GroceryListsModel });
  const groceryListsService = createGroceryListsService({ groceryListsRepository });
  const groceryListsController = createGroceryListsController({ groceryListsService });
  const groceryListsValidation = createGroceryListsValidation();

  const diaryRepository = createDiaryRepository({ DiaryModel });
  const diaryService = createDiaryService({ diaryRepository });
  const diaryController = createDiaryController({ diaryService });
  const diaryValidation = createDiaryValidation();

  const weightLogsRepository = createWeightLogsRepository({ WeightLogsModel });
  const weightLogsService = createWeightLogsService({ weightLogsRepository });
  const weightLogsController = createWeightLogsController({ weightLogsService });
  const weightLogsValidation = createWeightLogsValidation();

  const waterLogsRepository = createWaterLogsRepository({ WaterLogsModel });
  const waterLogsService = createWaterLogsService({ waterLogsRepository });
  const waterLogsController = createWaterLogsController({ waterLogsService });
  const waterLogsValidation = createWaterLogsValidation();

  const mediaRepository = createMediaRepository({ MediaModel });
  const storageProvider = overrides.storageProvider !== undefined ? overrides.storageProvider : providers.storage;
  const mediaService = createMediaService({ mediaRepository, storageProvider });
  const mediaController = createMediaController({ mediaService });
  const mediaValidation = createMediaValidation();

  const postsRepository = createPostsRepository({ PostsModel });
  const postsService = createPostsService({ postsRepository });
  const postsController = createPostsController({ postsService });
  const postsValidation = createPostsValidation();

  const commentsRepository = createCommentsRepository({ CommentsModel });
  const commentsService = createCommentsService({ commentsRepository });
  const commentsController = createCommentsController({ commentsService });
  const commentsValidation = createCommentsValidation();

  const reactionsRepository = createReactionsRepository({ ReactionsModel });
  const reactionsService = createReactionsService({ reactionsRepository });
  const reactionsController = createReactionsController({ reactionsService });
  const reactionsValidation = createReactionsValidation();

  const savedItemsRepository = createSavedItemsRepository({ SavedItemsModel });
  const savedItemsService = createSavedItemsService({ savedItemsRepository });
  const savedItemsController = createSavedItemsController({ savedItemsService });
  const savedItemsValidation = createSavedItemsValidation();

  const aiRepository = createAiRepository({ AiModel });
  const aiService = createAiService({ aiRepository });
  const aiController = createAiController({ aiService });
  const aiValidation = createAiValidation();

  const notificationsRepository = createNotificationsRepository({ NotificationsModel });
  const notificationsService = createNotificationsService({ notificationsRepository });
  const notificationsController = createNotificationsController({ notificationsService });
  const notificationsValidation = createNotificationsValidation();

  const remindersRepository = createRemindersRepository({ RemindersModel });
  const remindersService = createRemindersService({ remindersRepository });
  const remindersController = createRemindersController({ remindersService });
  const remindersValidation = createRemindersValidation();

  const reportsRepository = createReportsRepository({ ReportsModel });
  const reportsService = createReportsService({ reportsRepository });
  const reportsController = createReportsController({ reportsService });
  const reportsValidation = createReportsValidation();

  const moderationRepository = createModerationRepository({ ModerationModel });
  const moderationService = createModerationService({ moderationRepository });
  const moderationController = createModerationController({ moderationService });
  const moderationValidation = createModerationValidation();

  const auditLogsRepository = createAuditLogsRepository({ AuditLogsModel });
  const auditLogsService = createAuditLogsService({ auditLogsRepository });
  const auditLogsController = createAuditLogsController({ auditLogsService });
  const auditLogsValidation = createAuditLogsValidation();

  const videosRepository = createVideosRepository({ VideosModel });
  const videosService = createVideosService({ videosRepository });
  const videosController = createVideosController({ videosService });
  const videosValidation = createVideosValidation();

  const ratingsRepository = createRatingsRepository({ RatingsModel });
  const ratingsService = createRatingsService({ ratingsRepository });
  const ratingsController = createRatingsController({ ratingsService });
  const ratingsValidation = createRatingsValidation();

  const viewHistoryRepository = createViewHistoryRepository({ ViewHistoryModel });
  const viewHistoryService = createViewHistoryService({ viewHistoryRepository });
  const viewHistoryController = createViewHistoryController({ viewHistoryService });
  const viewHistoryValidation = createViewHistoryValidation();

  const adminDashboardRepository = createAdminDashboardRepository({ AdminDashboardModel });
  const adminDashboardService = createAdminDashboardService({ adminDashboardRepository });
  const adminDashboardController = createAdminDashboardController({ adminDashboardService });
  const adminDashboardValidation = createAdminDashboardValidation();

  const aiMonitoringRepository = createAiMonitoringRepository({ AiMonitoringModel });
  const aiMonitoringService = createAiMonitoringService({ aiMonitoringRepository });
  const aiMonitoringController = createAiMonitoringController({ aiMonitoringService });
  const aiMonitoringValidation = createAiMonitoringValidation();

  return {
    providers,
    logger, env, apiRateLimiter: (req,res,next) => next(),
    healthController,
    healthValidation,
    appConfigController,
    appConfigValidation,
    homeController,
    homeValidation,
    onboardingController,
    onboardingValidation,
    authController,
    authValidation,
    usersController,
    usersValidation,
    nutritionProfilesController,
    nutritionProfilesValidation,
    categoriesController,
    categoriesValidation,
    allergensController,
    allergensValidation,
    foodItemsController,
    foodItemsValidation,
    recipesController,
    recipesValidation,
    searchController,
    searchValidation,
    recommendationsController,
    recommendationsValidation,
    pantriesController,
    pantriesValidation,
    mealPlansController,
    mealPlansValidation,
    groceryListsController,
    groceryListsValidation,
    diaryController,
    diaryValidation,
    weightLogsController,
    weightLogsValidation,
    waterLogsController,
    waterLogsValidation,
    mediaController,
    mediaValidation,
    postsController,
    postsValidation,
    commentsController,
    commentsValidation,
    reactionsController,
    reactionsValidation,
    savedItemsController,
    savedItemsValidation,
    aiController,
    aiValidation,
    notificationsController,
    notificationsValidation,
    remindersController,
    remindersValidation,
    reportsController,
    reportsValidation,
    moderationController,
    moderationValidation,
    auditLogsController,
    auditLogsValidation,
    videosController,
    videosValidation,
    ratingsController,
    ratingsValidation,
    viewHistoryController,
    viewHistoryValidation,
    adminDashboardController,
    adminDashboardValidation,
    aiMonitoringController,
    aiMonitoringValidation,
  };
};
