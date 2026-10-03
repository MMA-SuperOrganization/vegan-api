import { buildRepository } from "../../common/persistence/repository.js";
export const createDiaryRepository = ({ repositories = {}, DiaryModel }) =>
  buildRepository({ repositories, key: "diaryEntries", model: DiaryModel });
