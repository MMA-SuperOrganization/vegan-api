import { AppError } from "../../common/errors/app-error.js";

export const createSearchService = ({ searchRepository }) => ({
  async searchContent(req) {
    return await searchRepository.findAll(req.query);
  },
  async getSearchSuggestions(req) {
    return await searchRepository.findAll(req.query);
  },
  async getRecentSearches(req) {
    return await searchRepository.findAll(req.query);
  },
  async clearRecentSearches(req) {
    return await searchRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async deleteRecentSearch(req) {
    return await searchRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
});
