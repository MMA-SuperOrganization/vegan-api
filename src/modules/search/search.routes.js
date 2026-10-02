import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { validate } from "../../common/middlewares/validate.js";
import { authenticate, optionalAuthenticate } from "../../common/middlewares/auth-guards.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { ROLES } from "../../common/constants/roles.js";

export const createSearchRoutes = ({ searchController, searchValidation }) => {
  const router = Router();
  router.get(
    "/search",
    validate(searchValidation.searchContent),
    asyncHandler(searchController.searchContent),
  );
  router.get(
    "/search/suggestions",
    validate(searchValidation.getSearchSuggestions),
    asyncHandler(searchController.getSearchSuggestions),
  );
  router.get(
    "/search/recent",
    authenticate,
    validate(searchValidation.getRecentSearches),
    asyncHandler(searchController.getRecentSearches),
  );
  router.delete(
    "/search/recent",
    authenticate,
    validate(searchValidation.clearRecentSearches),
    asyncHandler(searchController.clearRecentSearches),
  );
  router.delete(
    "/search/recent/:id",
    authenticate,
    validate(searchValidation.deleteRecentSearch),
    asyncHandler(searchController.deleteRecentSearch),
  );
  return router;
};
