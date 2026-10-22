// Explicit native E2E: dedicated AVD, real Firebase identity and a fresh isolated MongoDB.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import mongoose from "mongoose";
import pino from "pino";
import { loadEnv } from "../../src/config/env.js";
import { startServer } from "../../src/server.js";
import { createFirebaseAuth } from "../../src/config/firebase.js";
import { AndroidUi } from "./android-ui.mjs";

if (!process.argv.includes("--allow-external-test-user"))
  throw new Error(
    "Explicit --allow-external-test-user is required for temporary Firebase account creation and cleanup.",
  );
const serial = process.env.ANDROID_TEST_SERIAL || "emulator-5560";
const output = new URL("../../test-results/android-requirements/", import.meta.url);
const ui = new AndroidUi(serial, output);
const avd = await ui.adb("emu", "avd", "name");
assert.ok(
  avd
    .split("\n")
    .map((line) => line.trim())
    .includes("VEGETA_Requirement_Test"),
  "Refusing to clear data on a non-test AVD",
);
const database = "test_vegan_android_" + randomUUID().replaceAll("-", "");
const env = loadEnv({
  ...process.env,
  NODE_ENV: "test",
  PORT: "4011",
  MONGODB_DB_NAME: database,
  SWAGGER_ENABLED: "false",
  LOG_LEVEL: "silent",
  REMINDER_SCHEDULER_ENABLED: "false",
  FCM_ENABLED: "false",
  AI_ENABLED: "false",
  RATE_LIMIT_MAX: "10000",
  AUTH_RATE_LIMIT_MAX: "1000",
});
const email = "vegeta.android." + randomUUID().slice(0, 12) + "@example.com";
const password = "VegetaTest" + randomUUID().replaceAll("-", "").slice(0, 12);
const calls = [];
const verified = [];
let runtime;
let firebase;
let safeDatabase = false;
let firebaseRemoved = false;
const poll = async (read, predicate, description) => {
  const until = Date.now() + 30000;
  do {
    const value = await read();
    if (predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 250));
  } while (Date.now() < until);
  throw new Error("Persistence assertion failed: " + description);
};
try {
  await mkdir(output, { recursive: true });
  await rm(new URL("failure.json", output), { force: true });
  await rm(new URL("result.json", output), { force: true });
  await writeFile(new URL("cleanup-manifest.json", output), JSON.stringify({ database, email }));
  await mongoose.connect(env.database.uri, {
    dbName: database,
    autoIndex: false,
    autoCreate: false,
  });
  assert.equal(mongoose.connection.name, database);
  assert.equal((await mongoose.connection.db.listCollections().toArray()).length, 0);
  safeDatabase = true;
  runtime = await startServer({ env, logger: pino({ level: "silent" }) });
  runtime.server.on("request", (req, res) =>
    res.on("finish", () =>
      calls.push({ method: req.method, path: req.url.split("?")[0], status: res.statusCode }),
    ),
  );
  firebase = createFirebaseAuth(env.firebase);
  const models = runtime.container.models;
  const category = await models.categories.create({
    name: "Protein",
    slug: "native-protein",
    type: "food",
    status: "active",
  });
  const food = await models.foodItems.create({
    name: "Tofu",
    normalizedName: "tofu",
    slug: "native-tofu",
    categoryId: category._id,
    status: "active",
    isVegan: true,
    isVegetarian: true,
    allergenIds: [],
    defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
    nutritionPer100g: { caloriesKcal: 100, proteinG: 10, carbsG: 5, fatG: 4 },
  });
  for (const [index, title] of ["Native Tofu Plate", "Native Tofu Bowl"].entries()) {
    await models.recipes.create({
      title,
      normalizedTitle: title.toLowerCase(),
      slug: "native-recipe-" + index,
      authorId: new mongoose.Types.ObjectId(),
      status: "published",
      visibility: "public",
      publishedAt: new Date(),
      deletedAt: null,
      isVegan: true,
      isVegetarian: true,
      allergenIds: [],
      servings: 2,
      ingredients: [
        {
          foodItemId: food._id,
          foodNameSnapshot: "Tofu",
          quantity: 400,
          unit: "g",
          gramEquivalent: 400,
          isVegan: true,
        },
      ],
      nutritionPerServing: { caloriesKcal: 200, proteinG: 20, carbsG: 10, fatG: 5 },
      steps: [{ order: 1, instruction: "Cook the tofu." }],
    });
  }
  await models.allergens.create({ name: "Soy", slug: "soy", status: "active" });
  await ui.adb("reverse", "tcp:4011", "tcp:4011");
  await ui.adb("shell", "pm", "clear", "com.ngocthang.veganapp");
  await ui.adb("shell", "am", "start", "-W", "-n", "com.ngocthang.veganapp/.MainActivity");
  console.log("ANDROID: register and onboarding");
  await ui.tap("Bắt đầu");
  await ui.fill("Tên hiển thị", "Native QA");
  await ui.fill("Email", email);
  await ui.fill("Mật khẩu", password);
  await ui.scrollTo("Xác nhận mật khẩu");
  await ui.fill("Xác nhận mật khẩu", password);
  await ui.scrollTap("Đăng ký");
  await ui.tap("Loại chế độ ăn");
  await ui.tap("Thuần chay");
  await ui.tap("Mục tiêu sức khỏe");
  await ui.tap("Duy trì cân nặng");
  await ui.scrollTap("Tiếp tục");
  await ui.fill("Ngày sinh", "05/04/1998");
  await ui.fill("Chiều cao (cm)", "170");
  await ui.fill("Cân nặng (kg)", "65");
  await ui.scrollTap("Mức vận động");
  await ui.tap("Vừa phải");
  await ui.scrollTap("Tiếp tục");
  await ui.scrollTap("Tôi không có dị nguyên");
  await ui.scrollTap("Lưu và tiếp tục");
  await ui.scrollTap("Hoàn tất");
  await ui.waitFor(/Xin chào/);
  const account = await poll(
    () => models.users.findOne({ email }).lean(),
    (value) => value?.onboardingCompleted === true,
    "onboarding saved",
  );
  const userId = account._id;
  verified.push("real Firebase registration, onboarding and guarded navigation");
  await ui.capture("01-home");

  console.log("ANDROID: profile and nutrition targets");
  await ui.tap("Mở Cá nhân");
  await ui.tap("Chỉnh sửa hồ sơ");
  await ui.fill("Tên hiển thị", "Native QA Updated");
  await ui.scrollTap("Lưu thay đổi");
  await poll(
    () => models.users.findById(userId).lean(),
    (value) => value.displayName === "Native QA Updated",
    "profile update",
  );
  await ui.scrollTap("Hồ sơ dinh dưỡng");
  await ui.scrollTo("Mục tiêu kcal mỗi ngày");
  await ui.fill("Mục tiêu kcal mỗi ngày", "2000");
  await ui.scrollTo("Mục tiêu đạm mỗi ngày (g)");
  await ui.fill("Mục tiêu đạm mỗi ngày (g)", "100");
  await ui.scrollTo("Mục tiêu carb mỗi ngày (g)");
  await ui.fill("Mục tiêu carb mỗi ngày (g)", "250");
  await ui.scrollTo("Mục tiêu chất béo mỗi ngày (g)");
  await ui.fill("Mục tiêu chất béo mỗi ngày (g)", "60");
  await ui.scrollTap("Lưu thông tin dinh dưỡng");
  await poll(
    () => models.nutritionProfiles.findOne({ userId }).lean(),
    (value) =>
      value?.dailyCalorieTarget === 2000 &&
      value.proteinTargetG === 100 &&
      value.carbTargetG === 250 &&
      value.fatTargetG === 60,
    "nutrition targets",
  );
  verified.push("profile and all four nutrition targets persisted");
  await ui.capture("02-profile");
  await ui.tap("Mở Trang chủ");
  await ui.tap("Tìm công thức, bài viết, video…");
  await ui.fill("Search", "Native Tofu");
  await ui.tap("Perform search");
  await ui.waitFor(/Native Tofu/);
  await ui.capture("03-search");
  verified.push("recipe search");
  await ui.adb("shell", "input", "keyevent", "4");
  await ui.snapshot();
  await ui.adb("shell", "input", "keyevent", "4");
  await ui.tap("Mở Thực đơn");

  console.log("ANDROID: meal add, servings and replacement");
  await ui.scrollTap("+ Thêm món");
  await ui.tap(/Native Tofu Plate/);
  await ui.scrollTap("Tăng khẩu phần của Native Tofu Plate");
  await poll(
    () => models.MealPlansModel.findOne({ userId }).lean(),
    (value) => value?.days.some((day) => day.meals.some((meal) => meal.servings === 1.5)),
    "serving increase before replacing the recipe",
  );
  await ui.scrollTap("Thay Native Tofu Plate bằng công thức khác");
  await ui.tap(/Native Tofu Bowl/);
  const plan = await poll(
    () => models.MealPlansModel.findOne({ userId }).lean(),
    (value) =>
      value?.days.some((day) =>
        day.meals.some(
          (meal) => meal.recipeSnapshot.title === "Native Tofu Bowl" && meal.servings === 1.5,
        ),
      ),
    "meal replacement and servings",
  );
  await ui.waitFor("Tăng khẩu phần của Native Tofu Bowl");
  await ui.capture("04-meal-plan");
  verified.push("meal creation, serving update and recipe replacement");

  console.log("ANDROID: grocery generation and check state");
  const alternative = await models.MealPlansModel.create({
    userId,
    title: "Native alternative empty plan",
    weekStartDate: plan.weekStartDate,
    status: "draft",
    days: [],
    nutritionSummary: {},
  });
  await ui.tap("Mở Mua sắm");
  await ui.scrollTap("Tạo từ thực đơn");
  await ui.tap("Chọn thực đơn");
  await ui.tap(plan.title + " · Bản nháp");
  await ui.scrollTap("Tạo danh sách mua sắm");
  const grocery = await poll(
    () => models.GroceryListsModel.findOne({ userId }).lean(),
    (value) => value?.items.length > 0,
    "grocery generation",
  );
  assert.equal(grocery.items[0].quantity, 300);
  assert.equal(grocery.items[0].categorySnapshot, "Protein");
  await models.MealPlansModel.deleteOne({ _id: alternative._id, userId });
  await ui.waitFor("Đánh dấu Tofu");
  await ui.capture("05-grocery");
  await ui.tap("Đánh dấu Tofu");
  await poll(
    () => models.GroceryListsModel.findById(grocery._id).lean(),
    (value) => value.items[0].checked === true,
    "checked state",
  );
  await ui.tap("Đánh dấu Tofu");
  await poll(
    () => models.GroceryListsModel.findById(grocery._id).lean(),
    (value) => value.items[0].checked === false,
    "unchecked state",
  );
  verified.push("grocery generation, scaled quantities, category and check/uncheck persistence");

  console.log("ANDROID: diary, nutrition summary and weight");
  await ui.back();
  await ui.tap("Mở Nhật ký");
  await ui.tap(/Nhật ký hôm nay/);
  await ui.scrollTap("Thêm món đã ăn");
  await ui.tap("Công thức");
  await ui.tap(/Native Tofu Plate/);
  await ui.scrollTap("Lưu nhật ký");
  await poll(
    () => models.DiaryModel.findOne({ userId }).lean(),
    (value) => Boolean(value),
    "diary saved",
  );
  await ui.scrollTap("Xem tổng dinh dưỡng");
  await ui.waitFor(/200.*2[.,]000/);
  await ui.capture("06-nutrition-summary");
  verified.push("food diary and target comparison");
  await ui.back();
  await ui.back();
  await ui.tap("Theo dõi cân nặng");
  await ui.scrollTap("Ghi cân nặng");
  await ui.fill("Cân nặng (kg)", "64");
  await ui.tap("Lưu số đo");
  await poll(
    () => models.WeightLogsModel.findOne({ userId, weightKg: 64 }).lean(),
    (value) => Boolean(value),
    "weight saved",
  );
  await ui.waitFor("Ghi cân nặng");
  await ui.capture("07-weight");
  verified.push("weight creation, history and chart");
  await ui.back();
  await ui.tap("Mở Thực đơn");
  await ui.scrollTap("Xóa Native Tofu Bowl khỏi thực đơn");
  await ui.tap(/^xóa$/i);
  await poll(
    () => models.MealPlansModel.findById(plan._id).lean(),
    (value) => value.days.every((day) => day.meals.length === 0),
    "meal removal",
  );
  verified.push("meal removal persisted after confirmation");
  await ui.tap("Mở Cá nhân");
  await ui.scrollTap("Tài khoản & bảo mật");
  await ui.scrollTap("Đăng xuất");
  await ui.waitFor("Đăng nhập");
  await ui.capture("08-logout");
  verified.push("logout and return to authentication");
  console.log("ANDROID: all core persistence assertions passed");
  await writeFile(
    new URL("result.json", output),
    JSON.stringify(
      {
        passed: true,
        realFirebase: true,
        realMongo: true,
        serial,
        verified,
        requests: calls.length,
        mutations: calls.filter((call) => ["POST", "PUT", "PATCH", "DELETE"].includes(call.method))
          .length,
        calls,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await ui.capture("failure").catch(() => {});
  await writeFile(
    new URL("failure.json", output),
    JSON.stringify(
      {
        error: String(error.message)
          .replaceAll(password, "[REDACTED]")
          .replaceAll(email, "[TEST_EMAIL]"),
        verified,
        calls,
      },
      null,
      2,
    ),
  ).catch(() => {});
  throw new Error(
    String(error.message).replaceAll(password, "[REDACTED]").replaceAll(email, "[TEST_EMAIL]"),
  );
} finally {
  const cleanupErrors = [];
  let databaseCleared = false;
  try {
    if (firebase) {
      const testUser = await firebase.getUserByEmail(email).catch((error) => {
        if (error.code !== "auth/user-not-found") throw error;
        return null;
      });
      if (testUser) {
        assert.equal(testUser.email, email);
        await firebase.deleteUser(testUser.uid);
      }
      firebaseRemoved = true;
    }
  } catch (error) {
    cleanupErrors.push({ target: "firebase", code: error.code || error.name });
  }
  try {
    if (safeDatabase && mongoose.connection.readyState === 1) {
      assert.equal(mongoose.connection.name, database);
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const collection of collections)
        await mongoose.connection.db.collection(collection.name).deleteMany({});
      for (const collection of collections)
        assert.equal(await mongoose.connection.db.collection(collection.name).countDocuments(), 0);
      databaseCleared = true;
    }
  } catch (error) {
    cleanupErrors.push({ target: "isolatedDatabase", code: error.code || error.name });
  }
  try {
    await runtime?.stop("android-requirements-test");
  } catch (error) {
    cleanupErrors.push({ target: "server", code: error.code || error.name });
  }
  await mongoose.disconnect().catch(() => {});
  if (cleanupErrors.length) process.exitCode = 1;
  else await rm(new URL("cleanup-manifest.json", output), { force: true });
  console.log(
    JSON.stringify({
      cleanup: cleanupErrors.length === 0,
      firebaseRemoved,
      isolatedDatabaseCleared: databaseCleared,
      cleanupErrors,
    }),
  );
}
