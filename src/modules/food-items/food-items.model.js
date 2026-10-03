import mongoose from "mongoose";
const { Schema } = mongoose;
const nutritionSchema = new Schema(
  Object.fromEntries(
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
    ].map((key) => [key, { type: Number, min: 0, max: 1000000, default: 0 }]),
  ),
  { _id: false },
);
const servingSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0.000001 },
    unit: {
      type: String,
      required: true,
      enum: ["g", "kg", "ml", "l", "piece", "tbsp", "tsp", "cup", "serving"],
    },
    gramEquivalent: { type: Number, required: true, min: 0.000001 },
  },
  { _id: false },
);
const schema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    normalizedName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    aliases: [String],
    categoryId: { type: Schema.Types.ObjectId, ref: "Categories", required: true, index: true },
    imageUrl: String,
    defaultServing: { type: servingSchema, required: true },
    nutritionPer100g: { type: nutritionSchema, required: true },
    allergenIds: [{ type: Schema.Types.ObjectId, ref: "Allergens", index: true }],
    isVegan: { type: Boolean, required: true },
    isVegetarian: { type: Boolean, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Users" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Users" },
  },
  { timestamps: true, versionKey: false, collection: "fooditems" },
);
schema.index({ status: 1, normalizedName: 1 });
schema.index({ status: 1, isVegan: 1, categoryId: 1 });
export const FoodItemsModel = mongoose.models.FoodItems || mongoose.model("FoodItems", schema);
