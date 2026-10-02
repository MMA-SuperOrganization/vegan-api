import { Router } from "express";
import { validate } from "../../common/middlewares/validate.js";
import { z } from "zod";
export const createGroceryListRoutes = (container) => {
  const router = Router();
  const { groceryListController, authenticate } = container;
  const idSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) });
  router.use(authenticate);
  router.get("/", groceryListController.getAll);
  router.post("/", validate({ body: z.any() }), groceryListController.create);
  router.get("/:id", validate({ params: idSchema }), groceryListController.getById);
  router.patch("/:id", validate({ params: idSchema, body: z.any() }), groceryListController.update);
  router.delete("/:id", validate({ params: idSchema }), groceryListController.delete);
  return router;
};
