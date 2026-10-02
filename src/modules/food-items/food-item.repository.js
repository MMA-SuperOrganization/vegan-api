import { FoodItem } from "./food-item.model.js";

export const createFoodItemRepository = () => {
  return {
    async findById(id) {
      return FoodItem.findById(id).lean();
    },

    async findMany(filter = {}, options = {}) {
      const { page = 1, limit = 20, sort = { name: 1 } } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        FoodItem.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        FoodItem.countDocuments(filter),
      ]);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async create(data) {
      const foodItem = new FoodItem(data);
      await foodItem.save();
      return foodItem.toObject();
    },

    async updateById(id, updateData) {
      return FoodItem.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    },
  };
};
