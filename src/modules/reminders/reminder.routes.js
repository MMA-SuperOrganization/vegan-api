import { Router } from "express";
import { validate } from "../../common/middlewares/validate.js";
import { z } from "zod";
export const createReminderRoutes = (container) => {
  const router = Router();
  const { reminderController, authenticate } = container;
  const idSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) });
  router.use(authenticate);
  router.get("/", reminderController.getAll);
  router.post("/", validate({ body: z.any() }), reminderController.create);
  router.patch("/:id", validate({ params: idSchema, body: z.any() }), reminderController.update);
  router.delete("/:id", validate({ params: idSchema }), reminderController.delete);
  return router;
};
