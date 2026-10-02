import { Router } from "express";
import { validate } from "../../common/middlewares/validate.js";
import { z } from "zod";
export const createMealPlanRoutes = (container) => {
  const router = Router();
  const { mealPlanController, authenticate } = container;
  const idSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) });
  router.use(authenticate);
  router.get("/", mealPlanController.getAll);
  router.post("/", validate({ body: z.any() }), mealPlanController.create);
  router.get("/:id", validate({ params: idSchema }), mealPlanController.getById);
  router.patch("/:id", validate({ params: idSchema, body: z.any() }), mealPlanController.update);
  router.delete("/:id", validate({ params: idSchema }), mealPlanController.delete);
  return router;
};
