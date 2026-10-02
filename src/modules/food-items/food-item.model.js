import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    aliases: [
      {
        type: String,
        trim: true,
      },
    ],
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: 1024,
    },
    defaultServing: {
      amount: { type: Number, required: true },
      unit: { type: String, required: true },
      gramEquivalent: { type: Number, required: true },
    },
    nutritionPer100g: {
      caloriesKcal: { type: Number, default: 0 },
      proteinG: { type: Number, default: 0 },
      carbsG: { type: Number, default: 0 },
      fatG: { type: Number, default: 0 },
      fiberG: { type: Number, default: 0 },
      sugarG: { type: Number, default: 0 },
      sodiumMg: { type: Number, default: 0 },
      calciumMg: { type: Number, default: 0 },
      ironMg: { type: Number, default: 0 },
      vitaminB12Mcg: { type: Number, default: 0 },
      vitaminDMcg: { type: Number, default: 0 },
    },
    allergenIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Allergen",
      },
    ],
    isVegan: {
      type: Boolean,
      default: true,
    },
    isVegetarian: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    collection: "foodItems",
    timestamps: true,
    versionKey: false,
  },
);

export const FoodItem = mongoose.models.FoodItem ?? mongoose.model("FoodItem", foodItemSchema);
