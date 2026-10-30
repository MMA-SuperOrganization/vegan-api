import { createOperationControllers } from "../utils/operation-controller.js";

const CACHEABLE = new Set([
  "getCategories",
  "getAllergens",
  "searchFoodItems",
  "getFoodItem",
  "getAppConfig",
  "getRecipes",
  "getPosts",
  "getVideos",
  "searchContent",
  "getSearchSuggestions",
  "getHomeFeed",
]);

export const cachedController = (container, operation, handler) => {
  if (!container.cache || !CACHEABLE.has(operation.operationId)) return handler;
  const operationId = operation.operationId;
  return createOperationControllers({
    clock: container.clock,
    operations: {
      [operationId]: async (context) => {
        // An authenticated admin can see inactive records. Never share their result.
        if (context.actor) return container.operations[operationId](context);
        const load = () => container.operations[operationId](context);
        const read = () =>
          container.cache.remember(
            JSON.stringify([operationId, context.params, context.query]),
            load,
          );
        return container.standalone
          ? (container.standalone.read ?? container.standalone.run)(read)
          : read();
      },
    },
  })[operationId];
};
