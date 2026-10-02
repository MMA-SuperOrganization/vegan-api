import { Pantry } from "./pantry.model.js";
export const createPantryRepository = () => ({
  async findByUserId(userId) {
    return Pantry.findOne({ userId }).lean();
  },
  async create(data) {
    return (await new Pantry(data).save()).toObject();
  },
  async updateByUserId(userId, update) {
    return Pantry.findOneAndUpdate({ userId }, update, { new: true, upsert: true }).lean();
  },
});
