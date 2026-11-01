import mongoose from "mongoose";
import { describe, expect, it, vi } from "vitest";
import { createGroceryListsService } from "../../src/modules/grocery-lists/grocery-lists.service.js";

describe("grocery list service", () => {
  it("normalizes Mongo ingredient ObjectIds before transferring checked items to pantry", async () => {
    const foodItemId = new mongoose.Types.ObjectId();
    const personalIngredientId = new mongoose.Types.ObjectId();
    const list = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      status: "active",
      version: 4,
      items: [
        {
          itemId: "catalog-item",
          foodItemId,
          nameSnapshot: "Tomato",
          quantity: 1,
          unit: "kg",
          checked: true,
        },
        {
          itemId: "personal-item",
          personalIngredientId,
          nameSnapshot: "Suon chien",
          quantity: 1,
          unit: "piece",
          checked: true,
        },
      ],
    };
    const updatedList = { ...list, version: 5, items: [] };
    const groceryListsRepository = {
      findOne: vi.fn().mockResolvedValue(list),
      updateOne: vi.fn().mockResolvedValue(updatedList),
    };
    const addItems = vi.fn().mockResolvedValue({ items: [] });
    const service = createGroceryListsService({
      groceryListsRepository,
      services: { pantries: { addItems } },
      transaction: (work) => work(undefined),
    });

    const result = await service.operations.transferCheckedGroceryItemsToPantry({
      actor: { userId: String(list.userId) },
      params: { id: String(list._id) },
    });

    expect(addItems).toHaveBeenCalledWith(
      String(list.userId),
      [
        { foodItemId: String(foodItemId), quantity: 1, unit: "kg" },
        {
          personalIngredientId: String(personalIngredientId),
          quantity: 1,
          unit: "piece",
        },
      ],
      expect.objectContaining({
        idempotencyKey: `grocery-transfer:${list._id}:4`,
      }),
    );
    expect(result.transferredCount).toBe(2);
    expect(result.groceryList.items).toEqual([]);
  });
});
