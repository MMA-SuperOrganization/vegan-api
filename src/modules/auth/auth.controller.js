import { sendSuccess } from "../../common/utils/api-response.js";

export const createAuthController = ({ authService }) => ({
  async syncAuth(req, res) {
    const result = await authService.syncAuth(req);
    return sendSuccess(res, { data: result || {}, message: "syncAuth success" });
  },
  async getMe(req, res) {
    const result = await authService.getMe(req);
    return sendSuccess(res, { data: result || {}, message: "getMe success" });
  },
  async addFcmToken(req, res) {
    const result = await authService.addFcmToken(req);
    return sendSuccess(res, { data: result || {}, message: "addFcmToken success" });
  },
  async removeFcmToken(req, res) {
    const result = await authService.removeFcmToken(req);
    return sendSuccess(res, { data: result || {}, message: "removeFcmToken success" });
  },
});
