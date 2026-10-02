import { Router } from "express";
import { validate } from "../../common/middlewares/validate.js";
import { z } from "zod";
export const createWeightLogRoutes = (container) => {
  const router = Router();
  const { weightLogController, authenticate } = container;
  const idSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) });
  router.use(authenticate);
  router.get("/", weightLogController.getAll);
  router.post("/", validate({ body: z.any() }), weightLogController.create);
  router.patch("/:id", validate({ params: idSchema, body: z.any() }), weightLogController.update);
  router.delete("/:id", validate({ params: idSchema }), weightLogController.delete);
  return router;
};
