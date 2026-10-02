import { sendSuccess } from "../../common/utils/api-response.js";

export const createHomeController = ({ homeService }) => ({
  async getHomeFeed(req, res) {
    const result = await homeService.getHomeFeed(req);
    return sendSuccess(res, { data: result || {}, message: "getHomeFeed success" });
  },
});
