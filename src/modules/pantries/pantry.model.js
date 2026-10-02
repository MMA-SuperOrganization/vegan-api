import mongoose from "mongoose";
const pantryItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        itemId: { type: String, required: true },
        foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem" },
        foodNameSnapshot: String,
        quantity: Number,
        unit: String,
        expiresAt: Date,
        note: String,
        addedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, versionKey: false },
);
export const Pantry = mongoose.models.Pantry ?? mongoose.model("Pantry", pantryItemSchema);
