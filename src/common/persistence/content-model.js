import mongoose from "mongoose";

export const ref = (model, required = false) => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: model,
  required,
});
export const shortText = (max = 200) => ({ type: String, trim: true, maxlength: max });
export const contentFields = {
  authorId: { ...ref("Users", true), index: true },
  title: { ...shortText(), required: true },
  categoryIds: [ref("Categories")],
  tags: [shortText(60)],
  status: {
    type: String,
    enum: ["draft", "pending_review", "processing", "published", "rejected", "hidden", "deleted"],
    default: "draft",
    index: true,
  },
  visibility: { type: String, enum: ["public", "private", "unlisted"], default: "public" },
  publishedAt: Date,
  deletedAt: { type: Date, default: null },
  rejectionReason: shortText(1000),
  version: { type: Number, default: 0, min: 0 },
  viewReceipts: [{ _id: false, key: String, at: Date }],
  viewCount: { type: Number, default: 0, min: 0 },
  commentCount: { type: Number, default: 0, min: 0 },
  reactionCount: { type: Number, default: 0, min: 0 },
  saveCount: { type: Number, default: 0, min: 0 },
  ratingCount: { type: Number, default: 0, min: 0 },
  ratingSum: { type: Number, default: 0, min: 0 },
  ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
};
export const nutritionFields = Object.fromEntries(
  [
    "caloriesKcal",
    "proteinG",
    "carbsG",
    "fatG",
    "fiberG",
    "sugarG",
    "sodiumMg",
    "calciumMg",
    "ironMg",
    "vitaminB12Mcg",
    "vitaminDMcg",
  ].map((key) => [key, { type: Number, min: 0, default: 0 }]),
);
export const registerModel = (name, fields, collection, indexes = []) => {
  const schema = new mongoose.Schema(fields, {
    collection,
    timestamps: true,
    versionKey: false,
    strict: true,
  });
  for (const [keys, options] of indexes) schema.index(keys, options);
  return mongoose.models[name] ?? mongoose.model(name, schema);
};
export const contentIndexes = [
  [{ status: 1, visibility: 1, publishedAt: -1, _id: -1 }],
  [{ status: 1, visibility: 1, viewCount: -1, createdAt: -1, _id: -1 }],
  [{ status: 1, createdAt: 1, _id: 1 }],
  [{ authorId: 1, status: 1, createdAt: -1 }],
];
