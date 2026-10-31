import { z } from "zod";
import { id, pagination, patch, text, units } from "../../common/validators/domain.schemas.js";

export const personalIngredientInput = z.object({ name: text(150), defaultUnit: units }).strict();

const params = z.object({ id }).strict();

export const createPersonalIngredientsValidation = () => ({
  getIngredientSuggestions: {
    query: z
      .object({ q: text(100), limit: z.coerce.number().int().min(1).max(50).default(20) })
      .strict(),
  },
  getPersonalIngredients: {
    query: pagination.extend({ q: text(100).optional() }).strict(),
  },
  createPersonalIngredient: { body: personalIngredientInput },
  updatePersonalIngredient: { params, body: patch(personalIngredientInput) },
  deletePersonalIngredient: { params },
});
