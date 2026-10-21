// Real FE + HTTP services/repositories; external Firebase, AI, storage and push stay offline.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { buildTestApp, TEST_IDS } from "../helpers/test-app.js";

const frontendUrl = process.env.SPRINT2_FE_URL || "http://localhost:8085";
const output = new URL("../../test-results/expanded-mobile/", import.meta.url);
await mkdir(output, { recursive: true });
const FOOD = "200000000000000000000001";
const RECIPE = "300000000000000000000001";
const nutrition = { caloriesKcal: 200, proteinG: 20, carbsG: 25, fatG: 5, fiberG: 3 };
const providerCalls = [];
const aiProvider = {
  enabled: true,
  provider: "offline-test",
  async generate(input) {
    providerCalls.push(input);
    if (input.feature === "chat") return { data: { content: "Cook a tofu bowl with vegetables." } };
    if (input.feature === "meal_plan") {
      const request = JSON.parse(input.messages.at(-1).content).request;
      return {
        data: {
          title: "AI tofu day",
          days: [
            { date: request.startDate, meals: [{ slot: "lunch", recipeId: RECIPE, servings: 1 }] },
          ],
        },
      };
    }
    return { data: { items: [{ foodItemId: FOOD, name: "Tofu", quantity: 200, unit: "g" }] } };
  },
};
const fixture = buildTestApp({
  clock: () => new Date(),
  envOverrides: {
    AI_ENABLED: "true",
    AI_BASE_URL: "https://ai.example.test/v1",
    AI_API_KEY: "offline-key",
    AI_CHAT_MODEL: "chat",
    AI_VISION_MODEL: "vision",
  },
  overrides: { aiProvider },
  seed: {
    foodItems: [
      {
        _id: FOOD,
        name: "Tofu",
        normalizedName: "tofu",
        slug: "tofu",
        status: "active",
        isVegan: true,
        isVegetarian: true,
        allergenIds: [],
        nutritionPer100g: nutrition,
        defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
      },
    ],
    recipes: [
      {
        _id: RECIPE,
        title: "Tofu bowl",
        slug: "tofu-bowl",
        authorId: TEST_IDS.admin,
        status: "published",
        visibility: "public",
        deletedAt: null,
        servings: 1,
        isVegan: true,
        isVegetarian: true,
        allergenIds: [],
        nutritionPerServing: nutrition,
        ingredients: [
          {
            foodItemId: FOOD,
            foodNameSnapshot: "Tofu",
            quantity: 100,
            unit: "g",
            gramEquivalent: 100,
          },
        ],
        steps: [{ order: 1, instruction: "Cook tofu." }],
      },
    ],
  },
});
const { app, repositories, storageProvider } = fixture;
for (const id of [TEST_IDS.user, TEST_IDS.admin]) {
  await repositories.users.updateOne({ _id: id }, { $set: { onboardingCompleted: true } });
  await repositories.nutritionProfiles.create({
    userId: id,
    dailyCalorieTarget: 2000,
    allergenIds: [],
  });
}
const server = await new Promise((resolve) => {
  const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
});
const base = "http://127.0.0.1:" + server.address().port;
const adminRequest = async (path, body) => {
  const result = await fetch(base + "/api/v1" + path, {
    method: "POST",
    headers: { Authorization: "Bearer admin-token", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await result.json();
  assert.ok(result.ok, JSON.stringify(payload));
  return payload.data;
};
let browser;
let page;
const errors = [];
const mutations = [];
const screenshot = (name) =>
  page.screenshot({ path: fileURLToPath(new URL(name + ".png", output)), fullPage: true });
async function createPage(kind) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: "Asia/Ho_Chi_Minh",
  });
  await context.addInitScript(() => localStorage.setItem("app_locale", "en"));
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const cors = {
      "access-control-allow-origin": new URL(frontendUrl).origin,
      "access-control-allow-headers": "Content-Type, Authorization",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    };
    if (url.hostname === "identitytoolkit.googleapis.com") {
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      return route.fulfill({
        headers: cors,
        json: {
          idToken: kind + "-token",
          refreshToken: "offline-refresh",
          expiresIn: "3600",
          localId: "uid-" + kind,
          email: kind + "@example.com",
        },
      });
    }
    if (url.hostname === "fake-r2.example.com") {
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      assert.equal(
        request.headers().authorization,
        undefined,
        "Signed upload must not leak API token",
      );
      const key = decodeURIComponent(url.pathname.slice(1));
      storageProvider.objects.set(key, {
        contentType: request.headers()["content-type"],
        contentLength: request.postDataBuffer().length,
        etag: "offline-etag",
      });
      return route.fulfill({ status: 200, headers: cors });
    }
    const index = url.pathname.indexOf("/api/v1/");
    if (index !== -1) {
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()))
        mutations.push({
          method: request.method(),
          path: url.pathname,
          body: request.postDataJSON(),
        });
      const headers = { ...request.headers() };
      delete headers.host;
      delete headers.origin;
      const response = await route.fetch({
        url: base + url.pathname.slice(index) + url.search,
        headers,
      });
      return route.fulfill({ response, headers: { ...response.headers(), ...cors } });
    }
    if (url.origin === new URL(frontendUrl).origin) return route.continue();
    return route.abort();
  });
  const target = await context.newPage();
  target.setDefaultTimeout(30000);
  target.on("pageerror", (error) => errors.push(error.message));
  await target.goto(frontendUrl + "/profile", { timeout: 120000 });
  await target.getByRole("button", { name: "Sign in", exact: true }).click();
  await target.getByRole("textbox", { name: "Email", exact: true }).fill(kind + "@example.com");
  await target.getByRole("textbox", { name: "Password", exact: true }).fill("test-password");
  await target.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect
    .poll(() => mutations.filter((item) => item.path.endsWith("/auth/sync")).length)
    .toBeGreaterThan(kind === "admin" ? 1 : 0);
  return target;
}
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  page = await createPage("user");
  console.log("Checking AI chat and proposal confirmation");
  await page.goto(frontendUrl + "/ai");
  await page.getByRole("button", { name: "New conversation", exact: true }).click();
  await page.getByRole("textbox", { name: "Question", exact: true }).fill("Suggest lunch");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/Cook a tofu bowl with vegetables/)).toBeVisible();
  await page.getByRole("button", { name: "Helpful", exact: true }).click();
  await expect.poll(async () => (await repositories.aiFeedback.findMany({})).data.length).toBe(1);
  await screenshot("ai-chat");
  await page.goto(frontendUrl + "/ai/meal-planner");
  await page.getByRole("textbox", { name: "Days (1–7)", exact: true }).fill("1");
  await page.getByRole("button", { name: "Generate proposal", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Plan title", exact: true })).toHaveValue(
    "AI tofu day",
  );
  assert.equal((await repositories.mealPlans.findMany({})).data.length, 0);
  await expect(page.getByText("Tofu bowl", { exact: true })).toBeVisible();
  await screenshot("ai-meal-review");
  await page.getByRole("button", { name: "Confirm and save plan", exact: true }).click();
  await expect.poll(async () => (await repositories.mealPlans.findMany({})).data.length).toBe(1);
  await expect(
    page.getByRole("button", { name: "Replace Tofu bowl with another recipe", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Activate this plan", exact: true }).click();
  await page.getByRole("button", { name: "Confirm activation", exact: true }).click();
  await expect
    .poll(async () => (await repositories.mealPlans.findMany({})).data[0].status)
    .toBe("active");
  console.log("Checking pantry bulk, expiry and image recognition");
  await page.goto(frontendUrl + "/pantry/advanced");
  await page.getByRole("button", { name: "Add ingredient row", exact: true }).click();
  await page.getByRole("button", { name: "Resolve food item", exact: true }).click();
  await page.getByRole("button", { name: /Tofu/ }).click();
  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("150");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page
    .getByRole("textbox", { name: "Expiry (YYYY-MM-DD, optional)", exact: true })
    .fill(tomorrow);
  await page.getByRole("button", { name: "Save all to pantry", exact: true }).click();
  await expect(page.getByText("Ingredients saved to pantry.", { exact: true })).toBeVisible();
  await expect
    .poll(async () => (await repositories.pantries.findOne({ userId: TEST_IDS.user })).items.length)
    .toBe(1);
  await expect(page.getByRole("button", { name: "Edit ingredient", exact: true })).toBeVisible();
  await screenshot("pantry-advanced");
  await page.goto(frontendUrl + "/ai/ingredients");
  const fileChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose photo", exact: true }).click();
  await (
    await fileChooser
  ).setFiles({
    name: "tofu.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Recognize", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirm pantry additions", exact: true }),
  ).toBeVisible();
  assert.equal((await repositories.pantries.findOne({ userId: TEST_IDS.user })).items.length, 1);
  await screenshot("ingredient-review");
  await page.getByRole("button", { name: "Confirm pantry additions", exact: true }).click();
  await expect
    .poll(async () => (await repositories.pantries.findOne({ userId: TEST_IDS.user })).items.length)
    .toBe(2);
  await page.goto(frontendUrl + "/generate");
  await page
    .getByRole("switch", { name: "Subtract ingredients available in pantry", exact: true })
    .click();
  await page.getByRole("button", { name: "Generate grocery list", exact: true }).click();
  await expect.poll(async () => (await repositories.groceryLists.findMany({})).data.length).toBe(1);
  assert.deepEqual((await repositories.groceryLists.findMany({})).data[0].items, []);
  console.log("Checking community drafts, review, reactions, comments and reports");
  await page.goto(frontendUrl + "/community/editor");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("My tofu lunch");
  await page
    .getByRole("textbox", { name: "Content", exact: true })
    .fill("A simple vegan lunch with tofu.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("button", { name: "Submit for review", exact: true }).click();
  await expect(page.getByText("Pending review", { exact: true })).toBeVisible();
  const post = (await repositories.posts.findMany({ authorId: TEST_IDS.user })).data[0];
  await adminRequest("/posts/" + post._id + "/publish", { version: post.version });
  await page.reload();
  await page.getByRole("button", { name: "Like", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unlike", exact: true })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Write a comment", exact: true })
    .fill("Try adding sesame.");
  await page.getByRole("button", { name: "Save comment", exact: true }).click();
  await expect(page.getByText("Try adding sesame.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit comment", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Edit comment", exact: true })
    .fill("Try adding sesame and beans.");
  await page.getByRole("button", { name: "Save comment", exact: true }).click();
  await expect(page.getByText("Try adding sesame and beans.", { exact: true })).toBeVisible();
  await screenshot("community-post");
  await page.getByRole("button", { name: "Report post", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Please review this content.");
  await page.getByRole("button", { name: "Submit report", exact: true }).click();
  await expect(page.getByText("Report submitted.", { exact: true })).toBeVisible();
  await screenshot("my-reports");
  console.log("Checking reminder CRUD and pause/resume");
  await page.goto(frontendUrl + "/reminders");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("Water time");
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("Drink a glass of water.");
  await page.getByRole("button", { name: "Save reminder", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("Lunch water");
  await page.getByRole("button", { name: "Save reminder", exact: true }).click();
  await expect(page.getByText("Lunch water", { exact: true })).toBeVisible();
  await screenshot("reminders");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Confirm deletion", exact: true }).click();
  await expect
    .poll(async () => (await repositories.reminders.findOne({ userId: TEST_IDS.user })).status)
    .toBe("cancelled");
  console.log("Checking admin route guard and case lifecycle");
  await page.goto(frontendUrl + "/moderation");
  await expect(
    page.getByRole("button", { name: /Cook tofu|Bulk add, expiry|Advanced pantry/ }).first(),
  ).toBeVisible();
  const deviceResponse = await fetch(base + "/api/v1/auth/fcm-tokens", {
    method: "POST",
    headers: { Authorization: "Bearer user-token", "Content-Type": "application/json" },
    body: JSON.stringify({
      token: "offline-device-token",
      platform: "android",
      deviceName: "Offline browser test",
    }),
  });
  const device = (await deviceResponse.json()).data;
  assert.ok(deviceResponse.ok);
  await page.evaluate(
    ({ userId, tokenId }) => localStorage.setItem("push_registration_" + userId, tokenId),
    { userId: TEST_IDS.user, tokenId: device.tokenId },
  );
  await page.goto(frontendUrl + "/account-security");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect
    .poll(async () => (await repositories.users.findById(TEST_IDS.user)).fcmTokens.length)
    .toBe(0);
  page = await createPage("admin");
  for (const reject of [false, true]) {
    let pending = await adminRequest("/posts", {
      title: reject ? "Reject example" : "Approve example",
      content: "Review this vegan cooking discussion.",
      postType: "community",
      visibility: "public",
    });
    pending = await adminRequest("/posts/" + pending._id + "/submit", { version: pending.version });
    await page.goto(frontendUrl + "/moderation");
    await page.getByRole("button", { name: "Review content", exact: true }).click();
    await expect(
      page.getByText("Review this vegan cooking discussion.", { exact: true }),
    ).toBeVisible();
    if (reject)
      await page
        .getByRole("textbox", { name: "Rejection reason", exact: true })
        .fill("Please provide a detailed recipe.");
    await page.getByRole("button", { name: reject ? "Reject" : "Publish", exact: true }).click();
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect
      .poll(async () => (await repositories.posts.findById(pending._id)).status)
      .toBe(reject ? "rejected" : "published");
  }
  await page.goto(frontendUrl + "/moderation");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page.getByRole("button", { name: "Create or merge moderation case", exact: true }).click();
  await expect.poll(async () => (await repositories.moderation.findMany({})).data.length).toBe(1);
  await page.getByRole("button", { name: "Moderation cases", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Reason / resolution", exact: true })
    .fill("Temporarily review post.");
  await page.getByRole("button", { name: "Hide content", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect
    .poll(async () => (await repositories.posts.findById(post._id)).status)
    .toBe("hidden");
  await page
    .getByRole("textbox", { name: "Reason / resolution", exact: true })
    .fill("Review completed, content is valid.");
  await page.getByRole("button", { name: "Restore content", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect
    .poll(async () => (await repositories.posts.findById(post._id)).status)
    .toBe("published");
  await page
    .getByRole("textbox", { name: "Reason / resolution", exact: true })
    .fill("No violation after review.");
  await page.getByRole("button", { name: "Close: resolved", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect
    .poll(async () => (await repositories.reports.findMany({})).data[0].status)
    .toBe("resolved");
  await screenshot("moderation-cases");
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      mutations: mutations.length,
      aiCalls: providerCalls.length,
      screenshots: fileURLToPath(output),
    }),
  );
} catch (error) {
  if (page) {
    await screenshot("failure").catch(() => {});
    console.error((await page.locator("body").innerText()).slice(-7000));
  }
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
