import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mongoose from "mongoose";
import { loadEnv } from "../src/config/env.js";
import { FOOD_DESCRIPTIONS } from "./seed-data/food-descriptions.js";
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply")) throw new Error("Only --apply is supported");
const env = loadEnv();
try {
  await mongoose.connect(env.database.uri, {
    dbName: env.database.dbName,
    autoIndex: false,
    serverSelectionTimeoutMS: 10000,
  });
  const foods = mongoose.connection.db.collection("fooditems");
  const existing = await foods.find({}, { projection: { name: 1, description: 1 } }).toArray();
  const changes = existing.filter(
    (food) => !food.description?.trim() && FOOD_DESCRIPTIONS[food.name],
  );
  const unmapped = existing.filter(
    (food) => !food.description?.trim() && !FOOD_DESCRIPTIONS[food.name],
  );
  if (unmapped.length)
    throw new Error(`Missing descriptions: ${unmapped.map((food) => food.name).join(", ")}`);
  console.log(JSON.stringify({ total: existing.length, changes: changes.length }));
  if (args.includes("--apply") && changes.length) {
    const backup = join(
      await mkdtemp(join(tmpdir(), "vegeta-food-descriptions-")),
      "previous-descriptions.json",
    );
    await writeFile(backup, JSON.stringify(changes, null, 2));
    console.log(`Backup: ${backup}`);
    const result = await foods.bulkWrite(
      changes.map((food) => ({
        updateOne: {
          filter: { _id: food._id, description: food.description ?? null },
          update: { $set: { description: FOOD_DESCRIPTIONS[food.name], updatedAt: new Date() } },
        },
      })),
    );
    if (result.matchedCount !== changes.length)
      throw new Error("Concurrent updates detected; preview again");
    console.log(JSON.stringify({ updated: result.modifiedCount }));
  }
} finally {
  await mongoose.disconnect();
}
