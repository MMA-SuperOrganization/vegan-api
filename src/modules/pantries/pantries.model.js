import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: String, unique: true },
    items: [{}],
  },
  { timestamps: true, versionKey: false },
);

export const PantriesModel = mongoose.model("Pantries", schema);
