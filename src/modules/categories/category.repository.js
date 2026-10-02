import { Category } from "./category.model.js";

export const createCategoryRepository = () => {
  return {
    async findById(id) {
      return Category.findById(id).lean();
    },

    async findMany(filter = {}, options = {}) {
      const { sort = { sortOrder: 1, createdAt: -1 } } = options;
      return Category.find(filter).sort(sort).lean();
    },

    async create(data) {
      const category = new Category(data);
      await category.save();
      return category.toObject();
    },

    async updateById(id, updateData) {
      return Category.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    },
  };
};
