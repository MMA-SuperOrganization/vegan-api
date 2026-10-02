import { AppError } from "../../common/errors/app-error.js";

export const createAppConfigService = ({ appConfigRepository }) => ({
  async getAppConfig(req) {
    return await appConfigRepository.findAll(req.query);
  },
  async bootstrapApp(req) {
    return await appConfigRepository.findAll(req.query);
  },
});
