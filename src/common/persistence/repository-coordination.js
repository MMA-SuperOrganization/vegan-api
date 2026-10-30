import { REPOSITORY_MODEL } from "./repository.js";

const READS = ["findOne", "findById", "findMany", "count", "aggregate"];
const MUTATIONS = ["create", "updateOne", "deleteOne"];

export const coordinateRepositories = ({ repositories, standalone, cache }) => {
  if (!standalone && !cache) return;
  for (const repository of new Set(Object.values(repositories))) {
    const model = repository[REPOSITORY_MODEL];
    if (!model) continue;
    for (const method of [...READS, ...MUTATIONS]) {
      const original = repository[method].bind(repository);
      const mutation = MUTATIONS.includes(method);
      repository[method] = async (...args) => {
        const work = () => original(...args);
        const result = standalone
          ? await (mutation
              ? standalone.mutate(model, method, args, work)
              : (standalone.read ?? standalone.run)(work))
          : await work();
        if (mutation) await cache?.invalidate();
        return result;
      };
    }
  }
};
