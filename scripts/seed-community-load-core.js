export const COMMUNITY_LOAD_TAG_PREFIX = "community-load-v1-";

const topics = [
  ["đậu hũ", "đậu-hũ", "giàu-đạm"],
  ["nấm", "nấm", "umami"],
  ["đậu gà", "đậu-gà", "nhiều-chất-xơ"],
  ["đậu lăng", "đậu-lăng", "protein-thực-vật"],
  ["rau củ theo mùa", "rau-củ", "ăn-theo-mùa"],
  ["ngũ cốc nguyên hạt", "ngũ-cốc", "bữa-ăn-cân-bằng"],
  ["tempeh", "tempeh", "mẹo-bếp"],
  ["salad", "salad", "nhanh-gọn"],
  ["súp rau củ", "súp", "bữa-tối"],
  ["bữa sáng thực vật", "bữa-sáng", "ăn-xanh"],
];
const approaches = [
  "chuẩn bị trước cho cả tuần",
  "nêm nếm cân bằng hơn",
  "giữ được kết cấu ngon",
  "tận dụng nguyên liệu còn lại",
  "rút ngắn thời gian đứng bếp",
  "bổ sung thêm protein thực vật",
  "bảo quản đúng cách",
  "phối hợp cùng rau xanh",
  "giảm dầu nhưng vẫn đậm vị",
  "chia khẩu phần thuận tiện",
];

export function parseCommunityLoadCount(value = 1000) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 10_000)
    throw new Error("--count must be an integer from 1 to 10000");
  return count;
}

export function buildCommunityLoadPosts({
  authorIds,
  recipes = [],
  foodItems = [],
  categoryIds = [],
  count = 1000,
  now,
}) {
  const total = parseCommunityLoadCount(count);
  if (!authorIds?.length) throw new Error("Community load seed requires at least one test author");
  if (!recipes.length && !foodItems.length)
    throw new Error("Community load seed requires published recipes or active ingredients");

  return Array.from({ length: total }, (_, index) => {
    const sequence = index + 1;
    const marker = `${COMMUNITY_LOAD_TAG_PREFIX}${String(sequence).padStart(4, "0")}`;
    const [topic, topicTag, nutritionTag] = topics[index % topics.length];
    const approach = approaches[Math.floor(index / topics.length) % approaches.length];
    const recipe = recipes[index % recipes.length];
    const primaryFood = foodItems[index % foodItems.length];
    const secondaryFood = foodItems[(index * 7 + 3) % foodItems.length];
    const linkRecipe = Boolean(recipe && (!foodItems.length || index % 3 !== 1));
    const linkedFoods = [primaryFood, index % 5 === 0 ? secondaryFood : null].filter(Boolean);
    const foodItemIds = linkRecipe && index % 2 === 0 ? [] : linkedFoods.map((food) => food._id);
    const recipeId = linkRecipe ? recipe._id : null;
    if (!recipeId && !foodItemIds.length)
      throw new Error(`Generated post ${sequence} has no food relationship`);

    const ingredientNames = linkedFoods
      .map((food) => food.name)
      .filter(Boolean)
      .join(" và ");
    const recipeTitle = recipe?.title;
    const relationshipCopy = linkRecipe
      ? `Mình đang thử áp dụng cách này với công thức “${recipeTitle ?? "món chay liên quan"}”.`
      : `Nguyên liệu mình dùng hôm nay là ${ingredientNames || topic}.`;

    return {
      marker,
      document: {
        authorId: authorIds[index % authorIds.length],
        title: `${sequence}. Cùng thử ${topic}: ${approach}`,
        content: `Đây là bài viết kiểm thử có nội dung thực tế về ${topic}. Mình ưu tiên ${approach}, bắt đầu từ lượng nhỏ rồi điều chỉnh theo khẩu vị. ${relationshipCopy} Khi hoàn thành, mình ghi lại thời gian, độ mềm và hương vị để lần nấu sau dễ cải thiện hơn.`,
        tags: [marker, "du-lieu-kiem-thu", topicTag, nutritionTag],
        categoryIds,
        mediaIds: [],
        recipeId,
        foodItemIds,
        postType: "community",
        visibility: "public",
        status: "published",
        publishedAt: new Date(now.getTime() - index * 60 * 1000),
        deletedAt: null,
        rejectionReason: null,
      },
    };
  });
}
