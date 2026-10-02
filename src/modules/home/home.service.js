import { AppError } from "../../common/errors/app-error.js";

export const createHomeService = ({ homeRepository }) => ({
  async getHomeFeed(req) {
    return await homeRepository.findAll(req.query);
  },
});
