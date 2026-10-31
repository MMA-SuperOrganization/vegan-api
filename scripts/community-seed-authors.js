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
