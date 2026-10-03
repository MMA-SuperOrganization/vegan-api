import mongoose from "mongoose";
import { UNITS } from "../../common/utils/units.js";

const itemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItems", required: true },
    foodNameSnapshot: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: { type: Number, required: true, min: Number.EPSILON, max: 1000000 },
    unit: { type: String, enum: UNITS, required: true },
    expiresAt: Date,
    note: { type: String, trim: true, maxlength: 1000 },
    addedAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, unique: true },
    items: { type: [itemSchema], default: [], validate: (value) => value.length <= 500 },
    version: { type: Number, default: 0, min: 0 },
    bulkRequests: {
      type: [new mongoose.Schema({ key: String, hash: String }, { _id: false })],
      default: [],
      validate: (value) => value.length <= 100,
    },
  },
  { timestamps: true, versionKey: false, collection: "pantries" },
);
schema.index({ userId: 1, "items.expiresAt": 1 });
export const PantriesModel = mongoose.models.Pantries ?? mongoose.model("Pantries", schema);
