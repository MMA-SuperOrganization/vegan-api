import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mongoose from "mongoose";
import { loadEnv } from "../src/config/env.js";
import { foodImageUrl } from "./seed-data/food-images.js";

// Preview: node --env-file=.env scripts/update-food-images.js
// Apply:   node --env-file=.env scripts/update-food-images.js --apply
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply")) throw new Error("Only --apply is supported");
const env = loadEnv();

try {
  await mongoose.connect(env.database.uri, {
    dbName: env.database.dbName,
    serverSelectionTimeoutMS: 10000,
    autoIndex: false,
  });
  const collection = mongoose.connection.db.collection("fooditems");
  const foods = await collection.find({}, { projection: { name: 1, imageUrl: 1 } }).toArray();
  const changes = foods
    .map((food) => ({ ...food, nextImageUrl: foodImageUrl(food.name) }))
    .filter((food) => food.imageUrl !== food.nextImageUrl);

  // Validate every URL before making any database changes, including on repeated runs.
  const urls = [...new Set(foods.map((food) => foodImageUrl(food.name)))];
  for (let offset = 0; offset < urls.length; offset += 6) {
    await Promise.all(
      urls.slice(offset, offset + 6).map(async (url) => {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
        const bytes = new Uint8Array(await response.arrayBuffer());
        const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
        const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e;
        if (
          !response.ok ||
          !response.headers.get("content-type")?.startsWith("image/") ||
          bytes.length < 1000 ||
          (!jpeg && !png)
        )
          throw new Error(`Ingredient image is unavailable or invalid: ${url}`);
      }),
    );
  }
  console.log(
    JSON.stringify({ total: foods.length, verifiedUrls: urls.length, changes: changes.length }),
  );
  if (args.includes("--apply") && changes.length) {
    const backupDirectory = await mkdtemp(join(tmpdir(), "vegeta-food-images-"));
    const backupPath = join(backupDirectory, "previous-images.json");
    await writeFile(backupPath, JSON.stringify(changes, null, 2));
    console.log(`Previous image URLs saved to ${backupPath}`);
    const result = await collection.bulkWrite(
      changes.map((food) => ({
        updateOne: {
          // Preserve any concurrent image edits since the snapshot was read.
          filter: { _id: food._id, imageUrl: food.imageUrl ?? null },
          update: { $set: { imageUrl: food.nextImageUrl, updatedAt: new Date() } },
        },
      })),
    );
    console.log(JSON.stringify({ matched: result.matchedCount, updated: result.modifiedCount }));
    if (result.matchedCount !== changes.length)
      throw new Error("Some ingredients changed concurrently; run the preview again");
  }
  const saved = await collection.find({}, { projection: { name: 1, imageUrl: 1 } }).toArray();
  const remaining = saved.filter((food) => food.imageUrl !== foodImageUrl(food.name));
  console.log(JSON.stringify({ remaining: remaining.length, applied: args.includes("--apply") }));
  if (args.includes("--apply") && remaining.length) throw new Error("Image update is incomplete");
} finally {
  await mongoose.disconnect();
}
