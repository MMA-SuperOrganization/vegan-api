import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: String,
    normalizedName: String,
    slug: { type: String, unique: true },
    aliases: [String],
    categoryId: String,
    imageUrl: String,
    defaultServing: {},
    nutritionPer100g: {},
    allergenIds: [String],
    isVegan: Boolean,
    isVegetarian: Boolean,
    status: String,
    createdBy: String,
    updatedBy: String,
  },
  { timestamps: true, versionKey: false },
);

export const FoodItemsModel = mongoose.model("FoodItems", schema);
