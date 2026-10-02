import { Allergen } from "./allergen.model.js";

export const createAllergenRepository = () => {
  return {
    async findById(id) {
      return Allergen.findById(id).lean();
    },

    async findMany(filter = {}, options = {}) {
      const { sort = { name: 1 } } = options;
      return Allergen.find(filter).sort(sort).lean();
    },

    async create(data) {
      const allergen = new Allergen(data);
      await allergen.save();
      return allergen.toObject();
    },

    async updateById(id, updateData) {
      return Allergen.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    },
  };
};
