import { Router } from "express";
import { validate } from "../../common/middlewares/validate.js";
import { z } from "zod";
export const createWaterLogRoutes = (container) => {
  const router = Router();
  const { waterLogController, authenticate } = container;
  const idSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) });
  router.use(authenticate);
  router.get("/", waterLogController.getAll);
  router.post("/", validate({ body: z.any() }), waterLogController.create);
  router.patch("/:id", validate({ params: idSchema, body: z.any() }), waterLogController.update);
  router.delete("/:id", validate({ params: idSchema }), waterLogController.delete);
  return router;
};
