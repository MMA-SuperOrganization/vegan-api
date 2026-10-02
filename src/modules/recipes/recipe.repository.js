import { Recipe } from "./recipe.model.js";

export const createRecipeRepository = () => {
  return {
    async findById(id) {
      return Recipe.findById(id).lean();
    },

    async findMany(filter = {}, options = {}) {
      const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        Recipe.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Recipe.countDocuments(filter),
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
      const recipe = new Recipe(data);
      await recipe.save();
      return recipe.toObject();
    },

    async updateById(id, updateData) {
      return Recipe.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    },
  };
};
