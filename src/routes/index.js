import { Router } from "express";
import { apiManifest } from "./api-manifest.js";
import { validate } from "../common/middlewares/validate.js";
import { authorize } from "../common/middlewares/authorize.js";

export { CREATED } from "../common/constants/http-status.js";
export const createApiRouter = (container) => {
  const router = Router();
  router.registeredOperations = [];
  for (const operation of apiManifest) {
    const handler = container.controllers[operation.operationId];
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
    chain.push(handler);
    router[operation.method.toLowerCase()](operation.path, ...chain);
    router.registeredOperations.push({ ...operation, middleware: chain, validation: schemas });
  }
  return router;
};
