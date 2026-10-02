import { Router } from 'express';
import { createHealthRoutes } from '../modules/health/index.js';
import { createAppConfigRoutes } from '../modules/app-config/index.js';
import { createHomeRoutes } from '../modules/home/index.js';
import { createOnboardingRoutes } from '../modules/onboarding/index.js';
import { createAuthRoutes } from '../modules/auth/index.js';
import { createUsersRoutes } from '../modules/users/index.js';
import { createNutritionProfilesRoutes } from '../modules/nutrition-profiles/index.js';
import { createCategoriesRoutes } from '../modules/categories/index.js';
import { createAllergensRoutes } from '../modules/allergens/index.js';
import { createFoodItemsRoutes } from '../modules/food-items/index.js';
import { createRecipesRoutes } from '../modules/recipes/index.js';
import { createSearchRoutes } from '../modules/search/index.js';
import { createRecommendationsRoutes } from '../modules/recommendations/index.js';
import { createPantriesRoutes } from '../modules/pantries/index.js';
import { createMealPlansRoutes } from '../modules/meal-plans/index.js';
import { createGroceryListsRoutes } from '../modules/grocery-lists/index.js';
import { createDiaryRoutes } from '../modules/diary/index.js';
import { createWeightLogsRoutes } from '../modules/weight-logs/index.js';
import { createWaterLogsRoutes } from '../modules/water-logs/index.js';
import { createMediaRoutes } from '../modules/media/index.js';
import { createPostsRoutes } from '../modules/posts/index.js';
import { createCommentsRoutes } from '../modules/comments/index.js';
import { createReactionsRoutes } from '../modules/reactions/index.js';
import { createSavedItemsRoutes } from '../modules/saved-items/index.js';
import { createAiRoutes } from '../modules/ai/index.js';
import { createNotificationsRoutes } from '../modules/notifications/index.js';
import { createRemindersRoutes } from '../modules/reminders/index.js';
import { createReportsRoutes } from '../modules/reports/index.js';
import { createModerationRoutes } from '../modules/moderation/index.js';
import { createAuditLogsRoutes } from '../modules/audit-logs/index.js';
import { createVideosRoutes } from '../modules/videos/index.js';
import { createRatingsRoutes } from '../modules/ratings/index.js';
import { createViewHistoryRoutes } from '../modules/view-history/index.js';
import { createAdminDashboardRoutes } from '../modules/admin-dashboard/index.js';
import { createAiMonitoringRoutes } from '../modules/ai-monitoring/index.js';

export const createApiRouter = (container) => {
  const router = Router();
  router.use(createHealthRoutes({
    healthController: container.healthController,
    healthValidation: container.healthValidation
  }));
  router.use(createAppConfigRoutes({
    appConfigController: container.appConfigController,
    appConfigValidation: container.appConfigValidation
  }));
  router.use(createHomeRoutes({
    homeController: container.homeController,
    homeValidation: container.homeValidation
  }));
  router.use(createOnboardingRoutes({
    onboardingController: container.onboardingController,
    onboardingValidation: container.onboardingValidation
  }));
  router.use(createAuthRoutes({
    authController: container.authController,
    authValidation: container.authValidation
  }));
  router.use(createUsersRoutes({
    usersController: container.usersController,
    usersValidation: container.usersValidation
  }));
  router.use(createNutritionProfilesRoutes({
    nutritionProfilesController: container.nutritionProfilesController,
    nutritionProfilesValidation: container.nutritionProfilesValidation
  }));
  router.use(createCategoriesRoutes({
    categoriesController: container.categoriesController,
    categoriesValidation: container.categoriesValidation
  }));
  router.use(createAllergensRoutes({
    allergensController: container.allergensController,
    allergensValidation: container.allergensValidation
  }));
  router.use(createFoodItemsRoutes({
    foodItemsController: container.foodItemsController,
    foodItemsValidation: container.foodItemsValidation
  }));
  router.use(createRecipesRoutes({
    recipesController: container.recipesController,
    recipesValidation: container.recipesValidation
  }));
  router.use(createSearchRoutes({
    searchController: container.searchController,
    searchValidation: container.searchValidation
  }));
  router.use(createRecommendationsRoutes({
    recommendationsController: container.recommendationsController,
    recommendationsValidation: container.recommendationsValidation
  }));
  router.use(createPantriesRoutes({
    pantriesController: container.pantriesController,
    pantriesValidation: container.pantriesValidation
  }));
  router.use(createMealPlansRoutes({
    mealPlansController: container.mealPlansController,
    mealPlansValidation: container.mealPlansValidation
  }));
  router.use(createGroceryListsRoutes({
    groceryListsController: container.groceryListsController,
    groceryListsValidation: container.groceryListsValidation
  }));
  router.use(createDiaryRoutes({
    diaryController: container.diaryController,
    diaryValidation: container.diaryValidation
  }));
  router.use(createWeightLogsRoutes({
    weightLogsController: container.weightLogsController,
    weightLogsValidation: container.weightLogsValidation
  }));
  router.use(createWaterLogsRoutes({
    waterLogsController: container.waterLogsController,
    waterLogsValidation: container.waterLogsValidation
  }));
  router.use(createMediaRoutes({
    mediaController: container.mediaController,
    mediaValidation: container.mediaValidation
  }));
  router.use(createPostsRoutes({
    postsController: container.postsController,
    postsValidation: container.postsValidation
  }));
  router.use(createCommentsRoutes({
    commentsController: container.commentsController,
    commentsValidation: container.commentsValidation
  }));
  router.use(createReactionsRoutes({
    reactionsController: container.reactionsController,
    reactionsValidation: container.reactionsValidation
  }));
  router.use(createSavedItemsRoutes({
    savedItemsController: container.savedItemsController,
    savedItemsValidation: container.savedItemsValidation
  }));
  router.use(createAiRoutes({
    aiController: container.aiController,
    aiValidation: container.aiValidation
  }));
  router.use(createNotificationsRoutes({
    notificationsController: container.notificationsController,
    notificationsValidation: container.notificationsValidation
  }));
  router.use(createRemindersRoutes({
    remindersController: container.remindersController,
    remindersValidation: container.remindersValidation
  }));
  router.use(createReportsRoutes({
    reportsController: container.reportsController,
    reportsValidation: container.reportsValidation
  }));
  router.use(createModerationRoutes({
    moderationController: container.moderationController,
    moderationValidation: container.moderationValidation
  }));
  router.use(createAuditLogsRoutes({
    auditLogsController: container.auditLogsController,
    auditLogsValidation: container.auditLogsValidation
  }));
  router.use(createVideosRoutes({
    videosController: container.videosController,
    videosValidation: container.videosValidation
  }));
  router.use(createRatingsRoutes({
    ratingsController: container.ratingsController,
    ratingsValidation: container.ratingsValidation
  }));
  router.use(createViewHistoryRoutes({
    viewHistoryController: container.viewHistoryController,
    viewHistoryValidation: container.viewHistoryValidation
  }));
  router.use(createAdminDashboardRoutes({
    adminDashboardController: container.adminDashboardController,
    adminDashboardValidation: container.adminDashboardValidation
  }));
  router.use(createAiMonitoringRoutes({
    aiMonitoringController: container.aiMonitoringController,
    aiMonitoringValidation: container.aiMonitoringValidation
  }));

  return router;
};
