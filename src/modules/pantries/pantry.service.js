import crypto from "crypto";
import { AppError } from "../../common/errors/app-error.js";
export const createPantryService = ({ pantryRepository }) => ({
  async getPantry(userId) {
    let pantry = await pantryRepository.findByUserId(userId);
    if (!pantry) {
      pantry = await pantryRepository.create({ userId, items: [] });
    }
    return pantry;
  },
  async addItem(userId, itemData) {
    const pantry = await this.getPantry(userId);
    const newItem = {
      itemId: crypto.randomUUID(),
      ...itemData,
      addedAt: new Date(),
      updatedAt: new Date(),
    };
    pantry.items.push(newItem);
    return pantryRepository.updateByUserId(userId, { $set: { items: pantry.items } });
  },
  async updateItem(userId, itemId, updates) {
    const pantry = await this.getPantry(userId);
    const itemIndex = pantry.items.findIndex((i) => i.itemId === itemId);
    if (itemIndex === -1) throw AppError.notFound("Item not found");
    pantry.items[itemIndex] = { ...pantry.items[itemIndex], ...updates, updatedAt: new Date() };
    return pantryRepository.updateByUserId(userId, { $set: { items: pantry.items } });
  },
  async removeItem(userId, itemId) {
    return pantryRepository.updateByUserId(userId, { $pull: { items: { itemId } } });
  },
});
