import { AppError } from "../../common/errors/app-error.js";

export const createDiaryService = ({ diaryRepository }) => ({
  async getDiaryEntries(req) {
    return await diaryRepository.findAll(req.query);
  },
  async createDiaryEntry(req) {
    return await diaryRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async updateDiaryEntry(req) {
    return await diaryRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
  async deleteDiaryEntry(req) {
    return await diaryRepository.delete(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
    );
  },
  async getDiarySummary(req) {
    return await diaryRepository.findAll(req.query);
  },
});
