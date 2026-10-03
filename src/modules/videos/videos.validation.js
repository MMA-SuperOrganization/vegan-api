import { z } from "zod";
import { id, text, positive, pagination } from "../../common/validators/domain.schemas.js";
import {
  idParams,
  slugParams,
  versionBody,
  rejectBody,
  ids,
  tags,
  contentQuery,
  mineQuery,
  contentPatch,
  empty,
} from "../recipes/content.validation.js";
export const chapterInput = z
  .object({
    title: text(200),
    startSeconds: z.number().finite().min(0).max(86400),
    endSeconds: positive(86400),
  })
  .strict()
  .refine((c) => c.endSeconds > c.startSeconds, "Chapter end must follow start");
export const videoInput = z
  .object({
    title: text(200),
    description: text(10000, 0).optional(),
    thumbnailMediaId: id.optional().nullable(),
    videoMediaId: id,
    categoryIds: ids.optional(),
    tags: tags.optional(),
    durationSeconds: positive(86400),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    recipeId: id.optional().nullable(),
    transcript: text(100000, 0).optional(),
    chapters: z.array(chapterInput).max(200).optional(),
    visibility: z.enum(["public", "private", "unlisted"]).optional(),
  })
  .strict();
export const createVideosValidation = () => ({
  getVideos: {
    query: contentQuery.extend({
      recipeId: id.optional(),
      maxDurationSeconds: z.coerce.number().positive().max(86400).optional(),
    }),
  },
  getMyVideos: { query: mineQuery },
  getVideo: { params: slugParams },
  createVideo: { body: videoInput },
  updateVideo: { params: idParams, body: contentPatch(videoInput) },
  deleteVideo: { params: idParams },
  submitVideo: { params: idParams, body: versionBody },
  publishVideo: { params: idParams, body: versionBody },
  rejectVideo: { params: idParams, body: rejectBody },
  getRelatedVideos: { params: idParams, query: pagination.strict() },
  updateVideoProgress: {
    params: idParams,
    body: z
      .object({
        progressSeconds: z.number().finite().min(0).max(86400),
        completed: z.boolean().optional(),
      })
      .strict(),
  },
  getVideoTranscript: { params: idParams },
  generateVideoSummaryFromVideoId: { params: idParams, body: empty },
});
