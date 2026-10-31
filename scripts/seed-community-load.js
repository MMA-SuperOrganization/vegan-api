import { pathToFileURL } from "node:url";

import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { provisionCommunitySeedAuthors } from "./community-seed-authors.js";
import {
  buildCommunityLoadPosts,
  COMMUNITY_LOAD_TAG_PREFIX,
  parseCommunityLoadCount,
} from "./seed-community-load-core.js";

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const chunks = (values, size) =>
  Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );

export async function main() {
  const count = parseCommunityLoadCount(argument("--count") ?? 1000);
  const apply = process.argv.includes("--apply");
  const env = loadEnv();
  const logger = createLogger(env);
  const connection = await connectDatabase({ ...env.database, logger });
  try {
    const database = connection.db;
    const [recipes, foodItems, category, existing] = await Promise.all([
      database
        .collection("recipes")
        .find({ status: "published", visibility: "public", deletedAt: null })
        .sort({ publishedAt: -1, _id: -1 })
        .limit(200)
        .project({ _id: 1, title: 1 })
        .toArray(),
      database
        .collection("fooditems")
        .find({ status: { $ne: "inactive" }, deletedAt: null })
        .sort({ updatedAt: -1, _id: -1 })
        .limit(500)
        .project({ _id: 1, name: 1 })
        .toArray(),
      database.collection("categories").findOne({ type: "post", status: "active" }),
      database
        .collection("posts")
        .countDocuments({ tags: new RegExp(`^${COMMUNITY_LOAD_TAG_PREFIX}`) }),
    ]);

    logger.info(
      { count, existing, recipes: recipes.length, foodItems: foodItems.length, apply },
      apply ? "Applying community load seed" : "Community load seed dry run",
    );
    if (!apply) {
      logger.info("Re-run with --apply to write the deterministic load dataset");
      return;
    }

    const now = new Date();
    const authorIds = (await provisionCommunitySeedAuthors(database, now)).map(
      (author) => author._id,
    );
    const definitions = buildCommunityLoadPosts({
      authorIds,
      recipes,
      foodItems,
      categoryIds: category ? [category._id] : [],
      count,
      now,
    });
    let upserted = 0;
    let modified = 0;
    for (const batch of chunks(definitions, 250)) {
      const result = await database.collection("posts").bulkWrite(
        batch.map((definition) => ({
          updateOne: {
            filter: { tags: definition.marker },
            update: {
              $set: { ...definition.document, updatedAt: now },
              $setOnInsert: {
                createdAt: definition.document.publishedAt,
                version: 0,
                viewCount: 0,
                saveCount: 0,
                commentCount: 0,
                reactionCount: 0,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
      upserted += result.upsertedCount;
      modified += result.modifiedCount;
    }

    const total = await database
      .collection("posts")
      .countDocuments({ tags: new RegExp(`^${COMMUNITY_LOAD_TAG_PREFIX}`), deletedAt: null });
    logger.info({ requested: count, upserted, modified, total }, "Community load seed completed");
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
