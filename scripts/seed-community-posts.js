import mongoose from "mongoose";
import { pathToFileURL } from "node:url";

import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { buildCommunityDemoPosts } from "./seed-community-demo-core.js";
import { provisionCommunitySeedAuthors } from "./community-seed-authors.js";

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const resolveAuthor = async (database) => {
  const requestedId = argument("--author-id");
  if (requestedId && !mongoose.isValidObjectId(requestedId))
    throw new Error("--author-id must be a MongoDB ObjectId");

  const author = requestedId
    ? await database
        .collection("users")
        .findOne(
          { _id: new mongoose.Types.ObjectId(requestedId), status: "active" },
          { projection: { _id: 1, displayName: 1 } },
        )
    : (await provisionCommunitySeedAuthors(database, new Date(), 1))[0];
  if (!author) throw new Error("No active onboarded user is available for community post seeding");
  return author;
};

export async function main() {
  const env = loadEnv();
  const logger = createLogger(env);
  const connection = await connectDatabase({ ...env.database, logger });
  try {
    const database = connection.db;
    const author = await resolveAuthor(database);
    const now = new Date();
    const recipes = await database
      .collection("recipes")
      .find({ status: "published", visibility: "public", deletedAt: null })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(3)
      .project({ _id: 1 })
      .toArray();
    const foodItems = await database
      .collection("fooditems")
      .find({ status: { $ne: "inactive" }, deletedAt: null })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(24)
      .project({ _id: 1 })
      .toArray();
    const category = await database.collection("categories").findOne({
      type: "post",
      status: "active",
    });
    const definitions = buildCommunityDemoPosts({
      authorId: author._id,
      recipeIds: recipes.map((recipe) => recipe._id),
      foodItemIds: foodItems.map((foodItem) => foodItem._id),
      categoryIds: category ? [category._id] : [],
      now,
    });
    const posts = database.collection("posts");

    for (const definition of definitions)
      await posts.updateMany(
        { tags: definition.marker },
        {
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
        { upsert: true },
      );

    logger.info(
      {
        authorId: String(author._id),
        displayName: author.displayName,
        publishedPosts: definitions.length,
      },
      "Community newsfeed posts seeded",
    );
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
