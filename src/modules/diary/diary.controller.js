import { sendSuccess } from "../../common/utils/api-response.js";

export const createDiaryController = ({ diaryService }) => ({
  async getDiaryEntries(req, res) {
    const result = await diaryService.getDiaryEntries(req);
    return sendSuccess(res, { data: result || {}, message: "getDiaryEntries success" });
  },
  async createDiaryEntry(req, res) {
    const result = await diaryService.createDiaryEntry(req);
    return sendSuccess(res, { data: result || {}, message: "createDiaryEntry success" });
  },
  async updateDiaryEntry(req, res) {
    const result = await diaryService.updateDiaryEntry(req);
    return sendSuccess(res, { data: result || {}, message: "updateDiaryEntry success" });
  },
  async deleteDiaryEntry(req, res) {
    const result = await diaryService.deleteDiaryEntry(req);
    return sendSuccess(res, { data: result || {}, message: "deleteDiaryEntry success" });
  },
  async getDiarySummary(req, res) {
    const result = await diaryService.getDiarySummary(req);
    return sendSuccess(res, { data: result || {}, message: "getDiarySummary success" });
  },
});
