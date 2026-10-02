import { Router } from "express";
import { validate } from "../../common/middlewares/validate.js";
import { z } from "zod";
export const createNotificationRoutes = (container) => {
  const router = Router();
  const { notificationController, authenticate } = container;
  const idSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) });
  router.use(authenticate);
  router.get("/", notificationController.getAll);
  router.patch("/:id/read", validate({ params: idSchema }), notificationController.markAsRead);
  router.delete("/:id", validate({ params: idSchema }), notificationController.delete);
  return router;
};
