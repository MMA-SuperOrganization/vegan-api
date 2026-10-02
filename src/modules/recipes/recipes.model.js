import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    summary: String,
    description: String,
    coverMediaId: String,
    mediaIds: [String],
    categoryIds: [String],
    tags: [String],
    cuisine: String,
    servings: Number,
    prepMinutes: Number,
    cookMinutes: Number,
    difficulty: String,
    ingredients: [{}],
    steps: [{}],
    nutritionPerServing: {},
    allergenIds: [String],
    authorId: String,
    sourceType: String,
    status: { type: String, default: "draft" },
    visibility: { type: String, default: "public" },
    publishedAt: Date,
    deletedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

export const RecipesModel = mongoose.model("Recipes", schema);
