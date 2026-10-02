import { sendSuccess } from "../../common/utils/api-response.js";

export const createSearchController = ({ searchService }) => ({
  async searchContent(req, res) {
    const result = await searchService.searchContent(req);
    return sendSuccess(res, { data: result || {}, message: "searchContent success" });
  },
  async getSearchSuggestions(req, res) {
    const result = await searchService.getSearchSuggestions(req);
    return sendSuccess(res, { data: result || {}, message: "getSearchSuggestions success" });
  },
  async getRecentSearches(req, res) {
    const result = await searchService.getRecentSearches(req);
    return sendSuccess(res, { data: result || {}, message: "getRecentSearches success" });
  },
  async clearRecentSearches(req, res) {
    const result = await searchService.clearRecentSearches(req);
    return sendSuccess(res, { data: result || {}, message: "clearRecentSearches success" });
  },
  async deleteRecentSearch(req, res) {
    const result = await searchService.deleteRecentSearch(req);
    return sendSuccess(res, { data: result || {}, message: "deleteRecentSearch success" });
  },
});
