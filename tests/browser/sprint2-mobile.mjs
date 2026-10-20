// Browser regression against the real HTTP application with in-memory repositories.
// Firebase identity is stubbed at the provider boundary; no external accounts are created.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { buildTestApp, TEST_IDS } from "../helpers/test-app.js";

const frontendUrl = process.env.SPRINT2_FE_URL || "http://localhost:8085";
const output = new URL("../../test-results/sprint2-mobile/", import.meta.url);
await mkdir(output, { recursive: true });
const FOOD = "200000000000000000000001";
const CATEGORY = "200000000000000000000002";
const RECIPE = "300000000000000000000001";
const SECOND = "300000000000000000000002";
const nutrition = { caloriesKcal: 200, proteinG: 20, carbsG: 25, fatG: 5, fiberG: 3 };
const { app, repositories } = buildTestApp({
  clock: () => new Date(),
  seed: {
    categories: [
      { _id: CATEGORY, name: "Protein", slug: "protein", type: "food", status: "active" },
    ],
    foodItems: [
      {
        _id: FOOD,
        name: "Tofu",
        slug: "tofu",
        normalizedName: "tofu",
        status: "active",
        categoryId: CATEGORY,
        nutritionPer100g: nutrition,
      },
    ],
    recipes: [RECIPE, SECOND].map((_id, index) => ({
      _id,
      title: index ? "Tofu bowl" : "Tofu plate",
      slug: index ? "tofu-bowl" : "tofu-plate",
      normalizedTitle: index ? "tofu bowl" : "tofu plate",
      authorId: TEST_IDS.user,
      status: "published",
      visibility: "public",
      deletedAt: null,
      dietType: "vegan",
      servings: 2,
      ingredients: [
        {
          foodItemId: FOOD,
          foodNameSnapshot: "Tofu",
          quantity: 400,
          unit: "g",
          gramEquivalent: 400,
        },
      ],
      nutritionPerServing: nutrition,
    })),
  },
});
await repositories.users.updateOne({ _id: TEST_IDS.user }, { $set: { onboardingCompleted: true } });
await repositories.nutritionProfiles.create({
  userId: TEST_IDS.user,
  heightCm: 170,
  currentWeightKg: 65,
  dailyCalorieTarget: 2000,
  proteinTargetG: 100,
  carbTargetG: 250,
  fatTargetG: 60,
  allergenIds: [],
});
await repositories.weightLogs.create({
  userId: TEST_IDS.user,
  weightKg: 65,
  recordedAt: new Date(Date.now() - 7 * 86400000),
});
const server = await new Promise((resolve) => {
  const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
});
let browser;
let page;
const errors = [];
const mutations = [];
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: "Asia/Ho_Chi_Minh",
  });
  await context.addInitScript(() => localStorage.setItem("app_locale", "en"));
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const cors = {
      "access-control-allow-origin": new URL(frontendUrl).origin,
      "access-control-allow-headers": "Content-Type, Authorization",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    };
    if (url.hostname === "identitytoolkit.googleapis.com") {
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      return route.fulfill({
        headers: cors,
        json: {
          idToken: "user-token",
          refreshToken: "test-refresh",
          expiresIn: "3600",
          localId: "uid-user",
          email: "user@example.com",
        },
      });
    }
    const index = url.pathname.indexOf("/api/v1/");
    if (index !== -1) {
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method()))
        mutations.push({ method: req.method(), path: url.pathname, body: req.postDataJSON() });
      const headers = { ...req.headers() };
      delete headers.host;
      delete headers.origin;
      const response = await route.fetch({
        url: `http://127.0.0.1:${server.address().port}${url.pathname.slice(index)}${url.search}`,
        headers,
      });
      return route.fulfill({ response, headers: { ...response.headers(), ...cors } });
    }
    if (url.origin === new URL(frontendUrl).origin) return route.continue();
    return route.abort();
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${frontendUrl}/meal-plan`, { timeout: 120000 });
  console.log("Checking authentication and nutrition profile");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible({
    timeout: 120000,
  });
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("user@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(() => mutations.some((m) => m.path.endsWith("/auth/sync"))).toBe(true);
  await page.goto(`${frontendUrl}/nutrition-profile`);
  await page.getByRole("textbox", { name: "Daily protein target (g)", exact: true }).fill("110");
  await page.getByRole("button", { name: "Save nutrition details", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await repositories.nutritionProfiles.findOne({ userId: TEST_IDS.user })).proteinTargetG,
    )
    .toBe(110);
  await page.goto(`${frontendUrl}/meal-plan`);
  console.log("Checking meal planning");
  await page.getByRole("button", { name: "+ Add dish", exact: true }).first().click();
  await page.getByRole("button", { name: /Tofu plate/ }).click();
  await page.getByRole("button", { name: "Increase servings for Tofu plate", exact: true }).click();
  await page
    .getByRole("button", { name: "Replace Tofu plate with another recipe", exact: true })
    .click();
  await page.getByRole("button", { name: /Tofu bowl/ }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Replace Tofu bowl with another recipe", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: fileURLToPath(new URL("meal-plan.png", output)), fullPage: true });
  await page.goto(`${frontendUrl}/generate`);
  console.log("Checking grocery generation and checklist");
  const fromField = page.getByRole("textbox", { name: "From date (DD/MM/YYYY)", exact: true });
  const validFrom = await fromField.inputValue();
  await fromField.fill("31/02/2026");
  await expect(
    page.getByRole("button", { name: "Generate grocery list", exact: true }),
  ).toBeDisabled();
  await fromField.fill(validFrom);
  await page.screenshot({
    path: fileURLToPath(new URL("grocery-generate.png", output)),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Generate grocery list", exact: true }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page.getByRole("checkbox").click();
  await expect
    .poll(
      async () =>
        (await repositories.groceryLists.findMany({ userId: TEST_IDS.user })).data[0]?.items[0]
          ?.checked,
    )
    .toBe(true);
  await page.reload();
  await expect(page.getByRole("checkbox")).toBeChecked({ timeout: 30000 });
  await page.screenshot({ path: fileURLToPath(new URL("grocery.png", output)), fullPage: true });
  await page.goto(`${frontendUrl}/food-diary`);
  console.log("Checking diary and nutrition summary");
  await page.getByRole("button", { name: "Previous day", exact: true }).click();
  await page.getByRole("button", { name: "Add food eaten", exact: true }).click();
  await page.getByRole("button", { name: "Recipe", exact: true }).click();
  await page.getByRole("button", { name: /Tofu bowl/ }).click();
  await page.getByRole("button", { name: "Save to diary", exact: true }).click();
  await page.getByRole("button", { name: "View nutrition summary", exact: true }).click();
  await expect(page.getByText("200 / 2,000 kcal", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit current goals", exact: true }).click();
  await page.getByRole("textbox", { name: "Daily protein target (g)", exact: true }).fill("120");
  await page.getByRole("button", { name: "Save nutrition details", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await repositories.nutritionProfiles.findOne({ userId: TEST_IDS.user })).proteinTargetG,
    )
    .toBe(120);
  await page.goBack();
  console.log("Checking cached targets after profile update");
  await expect(page.getByText("20 / 120 g", { exact: true })).toBeVisible();
  await page.screenshot({
    path: fileURLToPath(new URL("nutrition-summary.png", output)),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Previous day", exact: true }).click();
  await expect(page.getByText("0 / 2,000 kcal", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "View nutrition summary", exact: true }).click();
  await expect(page.getByText("0 / 2,000 kcal", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Choose a date", exact: true }).click();
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  await page.getByRole("dialog").getByRole("button", { name: todayLabel, exact: true }).click();
  await expect(page.getByRole("button", { name: "Next day", exact: true })).toBeDisabled();
  await page.goto(`${frontendUrl}/weight`);
  console.log("Checking weight and logout");
  await page.getByRole("button", { name: "Log weight", exact: true }).click();
  await page.getByRole("textbox", { name: "Weight (kg)", exact: true }).fill("64.5");
  await page.getByRole("button", { name: "Save measurement", exact: true }).click();
  await expect
    .poll(
      async () => (await repositories.weightLogs.findMany({ userId: TEST_IDS.user })).data.length,
    )
    .toBe(2);
  await page.reload();
  await expect(page.getByText("64.5", { exact: true })).toBeVisible();
  await expect(page.getByText("Measurement history", { exact: true })).toBeVisible();
  await page.screenshot({ path: fileURLToPath(new URL("weight.png", output)), fullPage: true });
  await page.goto(`${frontendUrl}/account-security`);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible({
    timeout: 30000,
  });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      mutations: mutations.length,
      providers: "stubbed Firebase + in-memory repositories",
      viewport: "390x844",
    }),
  );
} catch (error) {
  if (page) {
    console.error((await page.locator("body").innerText()).slice(0, 10000));
    await page.screenshot({ path: fileURLToPath(new URL("failure.png", output)), fullPage: true });
  }
  throw error;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
