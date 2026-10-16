import { createEnum } from "./enum-factory.js";

export const MASTER_DATA_STATUSES = createEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
});

export const CATEGORY_TYPES = createEnum({
  FOOD: "food",
  RECIPE: "recipe",
  POST: "post",
});

export const MEASUREMENT_UNITS = createEnum({
  G: "g",
  KG: "kg",
  ML: "ml",
  L: "l",
  PIECE: "piece",
  TBSP: "tbsp",
  TSP: "tsp",
  CUP: "cup",
  SERVING: "serving",
});
