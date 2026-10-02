import { MealPlan } from "./meal-plan.model.js";
export const createMealPlanRepository = () => ({
  async findMany(filter) {
    return MealPlan.find(filter).lean();
  },
  async findById(id) {
    return MealPlan.findById(id).lean();
  },
  async create(data) {
    return (await new MealPlan(data).save()).toObject();
  },
  async updateById(id, data) {
    return MealPlan.findByIdAndUpdate(id, data, { new: true }).lean();
  },
  async deleteById(id) {
    return MealPlan.findByIdAndDelete(id).lean();
  },
});
