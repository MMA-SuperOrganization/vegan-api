import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    content: {
      type: String,
      trim: true, // Markdown
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      maxlength: 1024,
    },
    videoUrl: {
      type: String,
      trim: true,
      maxlength: 1024,
    },
    prepTimeMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    cookTimeMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    servings: {
      type: Number,
      min: 1,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    ingredients: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        unit: { type: String, required: true },
        foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem" },
        note: { type: String },
      },
    ],
    instructions: [
      {
        stepNumber: { type: Number, required: true },
        text: { type: String, required: true },
        imageUrl: { type: String },
      },
    ],
    nutritionPerServing: {
      caloriesKcal: { type: Number, default: 0 },
      proteinG: { type: Number, default: 0 },
      carbsG: { type: Number, default: 0 },
      fatG: { type: Number, default: 0 },
      fiberG: { type: Number, default: 0 },
    },
    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    dietaryTags: [
      {
        type: String,
        trim: true,
      },
    ],
    allergenIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Allergen",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected", "hidden"],
      default: "draft",
    },
    moderationNote: {
      type: String,
      trim: true,
    },
    publishedAt: {
      type: Date,
    },
    metrics: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      ratingAverage: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
    },
  },
  {
    collection: "recipes",
    timestamps: true,
    versionKey: false,
  },
);

export const Recipe = mongoose.models.Recipe ?? mongoose.model("Recipe", recipeSchema);
