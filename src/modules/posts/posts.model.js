import {
  registerModel,
  contentFields,
  contentIndexes,
  ref,
  shortText,
} from "../../common/persistence/content-model.js";
import { POST_TYPES, POST_VISIBILITIES } from "../../common/constants/enums/content.enums.js";

export const PostsModel = registerModel(
  "Posts",
  {
    ...contentFields,
    content: { ...shortText(30000), required: true },
    mediaIds: [ref("Media")],
    recipeId: ref("Recipes"),
    postType: { type: String, enum: POST_TYPES.values(), default: POST_TYPES.COMMUNITY },
    visibility: {
      type: String,
      enum: POST_VISIBILITIES.values(),
      default: POST_VISIBILITIES.PUBLIC,
    },
  },
  "posts",
  contentIndexes,
);
