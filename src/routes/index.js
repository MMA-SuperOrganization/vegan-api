import { Router } from "express";
import { createHash } from "node:crypto";
import { apiManifest } from "./api-manifest.js";
import { validate } from "../common/middlewares/validate.js";
import { authorize } from "../common/middlewares/authorize.js";
import { sendSuccess } from "../common/utils/api-response.js";

export const CREATED = new Set([
  "createRecipe",
  "createPost",
  "createVideo",
  "createCategory",
  "createAllergen",
  "createFoodItem",
  "createUploadRequest",
  "createMealPlan",
  "createGroceryList",
  "createDiaryEntry",
  "createWeightLog",
  "createWaterLog",
  "createComment",
  "createReport",
  "createReminder",
  "createAiConversation",
  "createMealPlanProposal",
  "recognizeIngredients",
  "createModerationCase",
]);
export const createApiRouter = (container) => {
  const router = Router();
  router.registeredOperations = [];
  for (const operation of apiManifest) {
    const handler = container.operations[operation.operationId];
    const schemas = container.validation[operation.operationId];
    if (!handler || !schemas)
      throw new Error(`Missing implementation/validation: ${operation.operationId}`);
    const chain = [];
    if (operation.auth === "firebase") chain.push(container.auth.firebaseAuthenticate);
    else if (operation.auth === "optional") chain.push(container.auth.optionalAuthenticate);
    else if (operation.auth !== "public") chain.push(container.auth.authenticate);
    if (operation.auth === "admin") chain.push(authorize("admin"));
    if (operation.operationId === "syncAuth") chain.push(container.authRateLimiter);
    if (operation.operationId === "createUploadRequest") chain.push(container.uploadRateLimiter);
    if (operation.module === "ai" || operation.operationId === "generateVideoSummaryFromVideoId")
      chain.push(container.aiRateLimiter);
    chain.push(validate(schemas));
    chain.push(async (req, res, next) => {
      try {
        const result = await handler({
          actor: req.auth ?? null,
          body: req.validated.body ?? {},
          params: req.validated.params ?? {},
          query: req.validated.query ?? {},
          requestId: req.id,
          ipHash: createHash("sha256")
            .update(`${req.ip}:${new Date().toISOString().slice(0, 10)}`)
            .digest("hex"),
        });
        const list =
          result &&
          typeof result === "object" &&
          Object.hasOwn(result, "data") &&
          Object.hasOwn(result, "meta");
        sendSuccess(res, {
          statusCode: CREATED.has(operation.operationId) ? 201 : 200,
          data: list ? result.data : (result ?? {}),
          meta: list ? result.meta : {},
        });
      } catch (error) {
        next(error);
      }
    });
    router[operation.method.toLowerCase()](operation.path, ...chain);
    router.registeredOperations.push({ ...operation, middleware: chain, validation: schemas });
  }
  return router;
};
