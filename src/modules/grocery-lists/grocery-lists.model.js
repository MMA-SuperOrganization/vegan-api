import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    name: String,
    sourceMealPlanId: String,
    status: String,
    items: [{}],
  },
  { timestamps: true, versionKey: false },
);

export const GroceryListsModel = mongoose.model("GroceryLists", schema);
