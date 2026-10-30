import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";
import { createFirebaseAuth } from "../src/config/firebase.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import {
  buildCommunityDemoPosts,
  validateCommunitySeedConfig,
} from "./seed-community-demo-core.js";

async function provisionFirebaseUser(firebaseAuth, input) {
  try {
    const existing = await firebaseAuth.getUserByEmail(input.email);
    return firebaseAuth.updateUser(existing.uid, {
      password: input.password,
      displayName: input.displayName,
      disabled: false,
      emailVerified: true,
    });
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    return firebaseAuth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      disabled: false,
      emailVerified: true,
    });
  }
}

export async function main() {
  const env = loadEnv();
  if (!env.firebase.enabled)
    throw new Error("Firebase Admin credentials are required to seed the demo login");
  const input = validateCommunitySeedConfig(env.seed.community);
  const identity = await provisionFirebaseUser(createFirebaseAuth(env.firebase), input);

  const logger = createLogger(env);
  const connection = await connectDatabase({ ...env.database, logger });
  try {
    const database = connection.db;
    const users = database.collection("users");
    const userProfiles = database.collection("userProfiles");
    const now = new Date();
    const user = await users.findOneAndUpdate(
      { firebaseUid: identity.uid },
      {
        $set: {
          email: input.email,
          displayName: input.displayName,
          role: "user",
          status: "active",
          onboardingCompleted: true,
          deletedAt: null,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );
    await userProfiles.updateOne(
      { userId: user._id },
      {
        $set: {
          bio: "Chia sẻ mẹo nấu chay đơn giản và thực tế.",
          username: "minh_an_xanh",
          locale: "vi",
          timezone: "Asia/Ho_Chi_Minh",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    const recipes = await database
      .collection("recipes")
      .find({ status: "published", visibility: "public", deletedAt: null })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(3)
      .project({ _id: 1 })
      .toArray();
    const category = await database.collection("categories").findOne({
      type: "post",
      status: "active",
    });
    const definitions = buildCommunityDemoPosts({
      authorId: user._id,
      recipeIds: recipes.map((recipe) => recipe._id),
      categoryIds: category ? [category._id] : [],
      now,
    });

    const posts = database.collection("posts");
    const seededPosts = [];
    for (const definition of definitions) {
      const post = await posts.findOneAndUpdate(
        { authorId: user._id, tags: definition.marker },
        {
          $set: { ...definition.document, updatedAt: now },
          $setOnInsert: {
            createdAt: now,
            version: 0,
            viewCount: 0,
            saveCount: 0,
            commentCount: 0,
            reactionCount: 0,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      seededPosts.push(post);
    }

    const moderator = await users.findOne({ role: "admin", status: "active" });
    if (moderator) {
      const reactions = database.collection("reactions");
      const comments = database.collection("comments");
      for (const [index, post] of seededPosts.slice(0, 3).entries()) {
        await reactions.updateOne(
          { userId: moderator._id, targetType: "post", targetId: post._id },
          { $set: { type: index === 1 ? "helpful" : "like", version: 0 } },
          { upsert: true },
        );
        if (index < 2)
          await comments.updateOne(
            {
              authorId: moderator._id,
              targetType: "post",
              targetId: post._id,
              content: "Cảm ơn bạn đã chia sẻ kinh nghiệm rất thực tế!",
            },
            {
              $setOnInsert: {
                status: "visible",
                parentCommentId: null,
                parentHidden: false,
                deletedAt: null,
                version: 0,
                reactionCount: 0,
                createdAt: now,
                updatedAt: now,
              },
            },
            { upsert: true },
          );
      }
      for (const post of seededPosts) {
        const [reactionCount, commentCount] = await Promise.all([
          reactions.countDocuments({ targetType: "post", targetId: post._id }),
          comments.countDocuments({
            targetType: "post",
            targetId: post._id,
            status: "visible",
            deletedAt: null,
          }),
        ]);
        await posts.updateOne({ _id: post._id }, { $set: { reactionCount, commentCount } });
      }
    }

    logger.info(
      {
        firebaseUid: identity.uid,
        email: input.email,
        publishedPosts: seededPosts.filter((post) => post.status === "published").length,
      },
      "Community demo account and posts seeded",
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
