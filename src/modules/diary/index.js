import { DiaryModel } from "./diary.model.js";
import { createDiaryRepository } from "./diary.repository.js";
import { createDiaryService } from "./diary.service.js";
import { createDiaryValidation } from "./diary.validation.js";
export { DiaryModel, createDiaryService, createDiaryRepository, createDiaryValidation };
export function createDiaryModule(deps = {}) {
  const repository = createDiaryRepository({ repositories: deps.repositories ?? {}, DiaryModel });
  const service = createDiaryService({ ...deps, diaryRepository: repository });
  return {
    operations: service.operations,
    validation: createDiaryValidation(),
    services: { diary: service.publicService },
    repositories: { diaryEntries: repository },
    models: { DiaryModel },
  };
}
