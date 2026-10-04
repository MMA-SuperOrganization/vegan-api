import mongoose from "mongoose";
import {
  registerModel,
  contentFields,
  contentIndexes,
  ref,
  shortText,
} from "../../common/persistence/content-model.js";
export const VideosModel = registerModel(
  "Videos",
  {
    ...contentFields,
    slug: { ...shortText(240), required: true, unique: true },
    description: shortText(10000),
    thumbnailMediaId: ref("Media"),
    videoMediaId: ref("Media", true),
    durationSeconds: { type: Number, min: 1, max: 86400, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    recipeId: ref("Recipes"),
    transcript: shortText(100000),
    summary: shortText(10000),
    chapters: [
      new mongoose.Schema(
        {
          title: shortText(),
          startSeconds: { type: Number, min: 0 },
          endSeconds: { type: Number, min: 0 },
        },
        { _id: false },
      ),
    ],
  },
  "videos",
  contentIndexes,
);
