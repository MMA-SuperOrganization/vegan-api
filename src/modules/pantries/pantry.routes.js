import { Router } from "express";
import { validate } from "../../common/middlewares/validate.js";
import { z } from "zod";
export const createPantryRoutes = (container) => {
  const router = Router();
  const { pantryController, authenticate } = container;
  router.use(authenticate);
  router.get("/", pantryController.getPantry);
  router.post(
    "/items",
    validate({ body: container.pantrySchema || z.any() }),
    pantryController.addItem,
  );
  router.patch(
    "/items/:itemId",
    validate({ params: z.object({ itemId: z.string() }), body: container.pantrySchema || z.any() }),
    pantryController.updateItem,
  );
  router.delete(
    "/items/:itemId",
    validate({ params: z.object({ itemId: z.string() }) }),
    pantryController.removeItem,
  );
  return router;
};
