import { sendSuccess } from "../../common/utils/api-response.js";

export const createAppConfigController = ({ appConfigService }) => ({
  async getAppConfig(req, res) {
    const result = await appConfigService.getAppConfig(req);
    return sendSuccess(res, { data: result || {}, message: "getAppConfig success" });
  },
  async bootstrapApp(req, res) {
    const result = await appConfigService.bootstrapApp(req);
    return sendSuccess(res, { data: result || {}, message: "bootstrapApp success" });
  },
});
