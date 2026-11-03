import { AppError } from "../errors/app-error.js";

export const presentContentMedia = async (deps, content, { actor, type } = {}) => {
  if (!content) return content;

  const output = { ...content };
  const contentType = type ?? content.type;
  if (contentType !== "recipe" || !content.coverMediaId) return output;

  const media = deps.services?.media;
  if (!media?.getById) throw AppError.serviceUnavailable("Media service is unavailable");

  const cover = await media.getById(content.coverMediaId, { actor });
  output.coverImageUrl = cover.downloadUrl ?? cover.url;
  return output;
};
