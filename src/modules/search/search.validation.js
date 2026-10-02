import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createSearchValidation = () => ({
  searchContent: {
    query: paginationSchema.passthrough(),
  },
  getSearchSuggestions: {
    query: paginationSchema.passthrough(),
  },
  getRecentSearches: {
    query: paginationSchema.passthrough(),
  },
  clearRecentSearches: {},
  deleteRecentSearch: {
    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),
  },
});
