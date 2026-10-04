import {
  registerModel,
  contentFields,
  contentIndexes,
  ref,
  shortText,
} from "../../common/persistence/content-model.js";
export const PostsModel = registerModel(
  "Posts",
  {
    ...contentFields,
    content: { ...shortText(30000), required: true },
    mediaIds: [ref("Media")],
    postType: { type: String, enum: ["community", "blog"], default: "community" },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
  },
  "posts",
  contentIndexes,
);
