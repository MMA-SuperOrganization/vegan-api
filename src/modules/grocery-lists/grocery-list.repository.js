import { GroceryList } from "./grocery-list.model.js";
export const createGroceryListRepository = () => ({
  async findMany(filter) {
    return GroceryList.find(filter).lean();
  },
  async findById(id) {
    return GroceryList.findById(id).lean();
  },
  async create(data) {
    return (await new GroceryList(data).save()).toObject();
  },
  async updateById(id, data) {
    return GroceryList.findByIdAndUpdate(id, data, { new: true }).lean();
  },
  async deleteById(id) {
    return GroceryList.findByIdAndDelete(id).lean();
  },
});
