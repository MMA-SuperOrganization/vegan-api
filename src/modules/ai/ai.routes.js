import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createAiRoutes = ({ aiController, aiValidation }) => {
  const router = Router();
  router.get(
    "/ai/conversations",
    authenticate,
    validate(aiValidation.getAiConversations),
    asyncHandler(aiController.getAiConversations),
  );
  router.post(
    "/ai/conversations",
    authenticate,
    validate(aiValidation.createAiConversation),
    asyncHandler(aiController.createAiConversation),
  );
  router.get(
    "/ai/conversations/:id/messages",
    authenticate,
    validate(aiValidation.getAiMessages),
    asyncHandler(aiController.getAiMessages),
  );
  router.post(
    "/ai/conversations/:id/messages",
    authenticate,
    validate(aiValidation.sendAiMessage),
    asyncHandler(aiController.sendAiMessage),
  );
  router.post(
    "/ai/meal-plan-proposals",
    authenticate,
    validate(aiValidation.createMealPlanProposal),
    asyncHandler(aiController.createMealPlanProposal),
  );
  router.post(
    "/ai/meal-plan-proposals/:proposalId/confirm",
    authenticate,
    validate(aiValidation.confirmMealPlanProposal),
    asyncHandler(aiController.confirmMealPlanProposal),
  );
  router.post(
    "/ai/ingredient-recognition",
    authenticate,
    validate(aiValidation.recognizeIngredients),
    asyncHandler(aiController.recognizeIngredients),
  );
  router.post(
    "/ai/pantry-proposals/:proposalId/confirm",
    authenticate,
    validate(aiValidation.confirmPantryProposal),
    asyncHandler(aiController.confirmPantryProposal),
  );
  router.post(
    "/ai/video-summaries",
    authenticate,
    validate(aiValidation.generateVideoSummary),
    asyncHandler(aiController.generateVideoSummary),
  );
  router.put(
    "/ai/runs/:runId/feedback",
    authenticate,
    validate(aiValidation.submitAiFeedback),
    asyncHandler(aiController.submitAiFeedback),
  );
  return router;
};
