import { sendSuccess } from "../../common/utils/api-response.js";

export const createViewHistoryController = ({ viewHistoryService }) => ({
  async getViewHistory(req, res) {
    const result = await viewHistoryService.getViewHistory(req);
    return sendSuccess(res, { data: result || {}, message: "getViewHistory success" });
  },
  async clearViewHistory(req, res) {
    const result = await viewHistoryService.clearViewHistory(req);
    return sendSuccess(res, { data: result || {}, message: "clearViewHistory success" });
  },
  async deleteViewHistoryItem(req, res) {
    const result = await viewHistoryService.deleteViewHistoryItem(req);
    return sendSuccess(res, { data: result || {}, message: "deleteViewHistoryItem success" });
  },
  async recordView(req, res) {
    const result = await viewHistoryService.recordView(req);
    return sendSuccess(res, { data: result || {}, message: "recordView success" });
  },
});
