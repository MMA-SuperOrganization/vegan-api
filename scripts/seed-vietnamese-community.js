import { pathToFileURL } from "node:url";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { buildCommunityDemoPosts } from "./seed-community-demo-core.js";
import {
  provisionVietnameseCommunityAuthors,
  VIETNAMESE_COMMUNITY_PERSONAS,
} from "./community-seed-authors.js";

const MARKER_PREFIX = "community-vietnamese-v2-";
const LEGACY_AUTHOR_PATTERN = /^(community-load-seed-|internal:vegeta-workbook-catalog:)/;
const ANGLES = [
  {
    title: "Góc bếp hôm nay",
    intro: "Mình vừa thử lại cách này trong bữa ăn hôm nay.",
    closing: "Nếu làm lần nữa, mình vẫn sẽ giữ cách chuẩn bị này vì dễ áp dụng và ít lãng phí.",
  },
  {
    title: "Kinh nghiệm sau khi nấu",
    intro: "Sau vài lần điều chỉnh, đây là cách cho kết quả ổn định nhất với căn bếp gia đình.",
    closing: "Bạn có thể bắt đầu với khẩu phần nhỏ rồi nêm lại theo nguyên liệu đang có.",
  },
  {
    title: "Gợi ý cho tuần mới",
    intro: "Mình đưa mẹo này vào kế hoạch bữa ăn tuần mới để tiết kiệm thời gian.",
    closing: "Chuẩn bị trước một phần giúp những ngày bận rộn vẫn có bữa chay cân bằng.",
  },
];

export function buildVietnameseCommunityPosts({
  authors,
  recipeIds,
  foodItemIds,
  categoryIds,
  now,
}) {
  const base = buildCommunityDemoPosts({
    authorId: authors[0]._id,
    recipeIds,
    foodItemIds,
    categoryIds,
    now,
  });
  return ANGLES.flatMap((angle, angleIndex) =>
    base.map((definition, articleIndex) => {
      const sequence = angleIndex * base.length + articleIndex + 1;
      const marker = `${MARKER_PREFIX}${String(sequence).padStart(3, "0")}`;
      const author = authors[(articleIndex + angleIndex * 4) % authors.length];
      return {
        marker,
        document: {
          ...definition.document,
          authorId: author._id,
          title: `${angle.title}: ${definition.document.title}`,
          content: `${angle.intro}\n\n${definition.document.content}\n\n${angle.closing}`,
          tags: [
            marker,
            "cộng-đồng-vegeta",
            "bài-viết-tiếng-việt",
            ...definition.document.tags.filter((tag) => !tag.startsWith("community-demo-")),
          ],
          publishedAt: new Date(now.getTime() - sequence * 3 * 60 * 60 * 1000),
        },
      };
    }),
  );
}

const chunks = (values, size) =>
  Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );

export async function seedVietnameseCommunity(database, { apply = false, now = new Date() } = {}) {
  const [recipes, foodItems, category, legacyAuthors] = await Promise.all([
    database
      .collection("recipes")
      .find({ status: "published", visibility: "public", deletedAt: null })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(24)
      .project({ _id: 1 })
      .toArray(),
    database
      .collection("fooditems")
      .find({ status: { $ne: "inactive" }, deletedAt: null })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(72)
      .project({ _id: 1 })
      .toArray(),
    database.collection("categories").findOne({ type: "post", status: "active" }),
    database
      .collection("users")
      .find({ firebaseUid: LEGACY_AUTHOR_PATTERN })
      .project({ _id: 1 })
      .toArray(),
  ]);
  if (!recipes.length && !foodItems.length)
    throw new Error("Vietnamese community seed requires recipes or ingredients");
  const existing = await database.collection("posts").countDocuments({
    tags: new RegExp(`^${MARKER_PREFIX}`),
    deletedAt: null,
  });
  if (!apply)
    return {
      mode: "dry-run",
      authors: VIETNAMESE_COMMUNITY_PERSONAS.length,
      posts: 24 * ANGLES.length,
      existing,
      legacySeedAuthors: legacyAuthors.length,
    };

  const authors = await provisionVietnameseCommunityAuthors(database, now);
  const definitions = buildVietnameseCommunityPosts({
    authors,
    recipeIds: recipes.map((recipe) => recipe._id),
    foodItemIds: foodItems.map((food) => food._id),
    categoryIds: category ? [category._id] : [],
    now,
  });
  const posts = database.collection("posts");
  const legacyResult = legacyAuthors.length
    ? await posts.updateMany(
        {
          authorId: { $in: legacyAuthors.map((author) => author._id) },
          tags: { $not: new RegExp(`^${MARKER_PREFIX}`) },
          status: { $ne: "deleted" },
        },
        { $set: { status: "deleted", deletedAt: now, updatedAt: now } },
      )
    : { modifiedCount: 0 };
  let upserted = 0;
  let modified = 0;
  for (const batch of chunks(definitions, 100)) {
    const result = await posts.bulkWrite(
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
  return {
    mode: "apply",
    authors: authors.length,
    posts: definitions.length,
    upserted,
    modified,
    legacyPostsArchived: legacyResult.modifiedCount,
  };
}

export async function main() {
  const env = loadEnv();
  const logger = createLogger(env);
  try {
    const connection = await connectDatabase({ ...env.database, logger });
    console.log(
      JSON.stringify(
        await seedVietnameseCommunity(connection.db, {
          apply: process.argv.includes("--apply"),
        }),
        null,
        2,
      ),
    );
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
