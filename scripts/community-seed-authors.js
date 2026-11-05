export async function provisionCommunitySeedAuthors(database, now, count = 5) {
  const users = database.collection("users");
  const profiles = database.collection("userProfiles");
  const authors = [];
  for (let index = 1; index <= count; index += 1) {
    const firebaseUid = `community-load-seed-${index}`;
    const author = await users.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          email: `community-load-${index}@vegeta.invalid`,
          displayName: `Cộng đồng kiểm thử ${index}`,
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
    await profiles.updateOne(
      { userId: author._id },
      {
        $set: {
          username: `vegeta_load_seed_${index}`,
          bio: "Tài khoản dữ liệu kiểm thử tải lớn của VEGETA.",
          locale: "vi",
          timezone: "Asia/Ho_Chi_Minh",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    authors.push(author);
  }
  return authors;
}

export const VIETNAMESE_COMMUNITY_PERSONAS = [
  ["minh-an-xanh", "Minh Ăn Xanh", "Bếp chay gia đình, ưu tiên món dễ nấu và đủ chất."],
  ["lan-bep-nho", "Lan Bếp Nhỏ", "Chia sẻ cách chuẩn bị bữa chay gọn gàng cho người bận rộn."],
  ["nam-me-rau", "Nam Mê Rau", "Thích rau theo mùa, các món áp chảo và giảm lãng phí thực phẩm."],
  [
    "thao-dinh-duong",
    "Thảo Dinh Dưỡng",
    "Ghi chép cân bằng đạm thực vật, chất xơ và khẩu phần hằng ngày.",
  ],
  ["huy-bep-xanh", "Huy Bếp Xanh", "Thử nghiệm món chay Việt Nam với nguyên liệu quen thuộc."],
  [
    "mai-meal-prep",
    "Mai Meal Prep",
    "Chuẩn bị bữa ăn theo tuần và bảo quản nguyên liệu đúng cách.",
  ],
  ["an-nhien", "An Nhiên", "Yêu bữa sáng lành mạnh, trà thảo mộc và món ăn nhẹ từ thực vật."],
  ["bao-bep-vui", "Bảo Bếp Vui", "Nấu món chay nhanh, dễ làm và phù hợp cho cả gia đình."],
  ["linh-song-xanh", "Linh Sống Xanh", "Ăn theo mùa, mua vừa đủ và tận dụng trọn vẹn nguyên liệu."],
  ["phuong-mon-chay", "Phương Món Chay", "Khám phá gia vị, nước sốt và kỹ thuật tạo vị umami."],
  ["khoa-tap-nau", "Khoa Tập Nấu", "Ghi lại những lần thử món chay đầu tiên và bài học trong bếp."],
  ["vy-bua-nha", "Vy Bữa Nhà", "Chia sẻ thực đơn thuần chay gần gũi cho bữa cơm Việt."],
];

export async function provisionVietnameseCommunityAuthors(database, now) {
  const users = database.collection("users");
  const profiles = database.collection("userProfiles");
  const authors = [];
  for (const [slug, displayName, bio] of VIETNAMESE_COMMUNITY_PERSONAS) {
    const firebaseUid = `community-vietnamese-v2-${slug}`;
    const author = await users.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          email: `${slug}@community.vegeta.invalid`,
          displayName,
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
    await profiles.updateOne(
      { userId: author._id },
      {
        $set: {
          username: `v2_${slug.replaceAll("-", "_")}`,
          bio,
          locale: "vi",
          timezone: "Asia/Ho_Chi_Minh",
          dietType: "vegan",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    authors.push(author);
  }
  return authors;
}
