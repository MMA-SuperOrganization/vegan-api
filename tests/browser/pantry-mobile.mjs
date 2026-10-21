// Run against the frontend dev server. All API calls use the injected test app;
// no production database, Firebase account, or provider is contacted.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { buildTestApp, TEST_IDS } from "../helpers/test-app.js";

const frontendUrl = process.env.PANTRY_FE_URL || "http://localhost:8085";
const output = new URL("../../test-results/pantry-mobile/", import.meta.url);
await mkdir(output, { recursive: true });
const FOOD = "200000000000000000000001";
const { app, repositories } = buildTestApp({
  clock: () => new Date(),
  seed: {
    foodItems: [
      ...Array.from({ length: 20 }, (_, index) => ({
        _id: `2000000000000000000000${String(index + 10).padStart(2, "0")}`,
        name: `Ingredient ${index + 1}`,
        normalizedName: `ingredient ${String(index + 1).padStart(2, "0")}`,
        slug: `ingredient-${index + 1}`,
        status: "active",
      })),
      { _id: FOOD, name: "Tofu", normalizedName: "tofu", slug: "tofu", status: "active" },
    ],
  },
});
await repositories.users.updateOne({ _id: TEST_IDS.user }, { $set: { onboardingCompleted: true } });
const server = await new Promise((resolve) => {
  const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
});
const backendUrl = `http://127.0.0.1:${server.address().port}`;
let browser;
let page;
const browserErrors = [];
const mutations = [];
let failNextAdd = false;
let failedReadsRemaining = 0;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    timezoneId: "Asia/Ho_Chi_Minh",
  });
  await context.addInitScript(() => {
    localStorage.setItem("auth_token", "user-token");
    localStorage.setItem("auth_token_expires_at", String(Date.now() + 3_600_000));
    if (!localStorage.getItem("app_locale")) localStorage.setItem("app_locale", "en");
  });
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const apiIndex = url.pathname.indexOf("/api/v1/");
    if (apiIndex !== -1) {
      const apiPath = url.pathname.slice(apiIndex) + url.search;
      const cors = {
        "access-control-allow-origin": new URL(frontendUrl).origin,
        "access-control-allow-headers": "Content-Type, Authorization",
        "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
      };
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      if (failedReadsRemaining > 0 && apiPath === "/api/v1/pantry" && req.method() === "GET") {
        failedReadsRemaining -= 1;
        return route.fulfill({
          status: 503,
          headers: cors,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: { code: "SERVICE_UNAVAILABLE" } }),
        });
      }
      if (failNextAdd && apiPath === "/api/v1/pantry/items" && req.method() === "POST") {
        failNextAdd = false;
        return route.fulfill({
          status: 503,
          headers: cors,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: { code: "SERVICE_UNAVAILABLE", message: "Test failure" },
          }),
        });
      }
      if (["POST", "PATCH", "DELETE"].includes(req.method()) && apiPath.includes("/pantry")) {
        assert.equal(req.headers().authorization, "Bearer user-token");
        mutations.push({ method: req.method(), path: apiPath, body: req.postDataJSON() });
      }
      const headers = { ...req.headers() };
      delete headers.host;
      delete headers.origin;
      delete headers["content-length"];
      const response = await context.request.fetch(`${backendUrl}${apiPath}`, {
        method: req.method(),
        headers,
        data: req.postData() ?? undefined,
      });
      return route.fulfill({ response, headers: { ...response.headers(), ...cors } });
    }
    if (url.origin === new URL(frontendUrl).origin) return route.continue();
    return route.abort();
  });
  page = await context.newPage();
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto(`${frontendUrl}/profile`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await expect(page.getByRole("button", { name: /^Add ingredient/ })).toBeVisible({
    timeout: 120_000,
  });
  await page.screenshot({ path: fileURLToPath(new URL("profile-en.png", output)) });
  await page.getByRole("button", { name: /^Add ingredient/ }).click();
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: /^Open pantry/ }).click();
  await expect(page.getByText("No ingredients found", { exact: true })).toBeVisible();
  await page.screenshot({ path: fileURLToPath(new URL("profile-entry-pantry.png", output)) });
  await page.goto(`${frontendUrl}/grocery`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByRole("button", { name: "Open pantry", exact: true }).click({ timeout: 120_000 });
  await expect(page.getByText("No ingredients found", { exact: true })).toBeVisible({
    timeout: 120_000,
  });
  await page.screenshot({ path: fileURLToPath(new URL("empty-en.png", output)) });
  await page.getByRole("button", { name: "Add ingredient", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Please choose a food from the list.")).toBeVisible();
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await page.getByRole("button", { name: "Load more", exact: true }).click();
  await page.getByRole("button", { name: "Tofu", exact: true }).click();
  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("0");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByText("Quantity must be greater than 0 and at most 1,000,000."),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("500");
  await page
    .getByRole("textbox", { name: "Expiry date (optional)", exact: true })
    .fill("2026-02-30");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Enter a valid date in YYYY-MM-DD format.")).toBeVisible();
  const tomorrow = new Date(Date.now() + 86_400_000);
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);
  await page.getByRole("textbox", { name: "Expiry date (optional)", exact: true }).fill(day);
  await page.getByRole("textbox", { name: "Note", exact: true }).fill("Keep chilled");
  failNextAdd = true;
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Quantity", exact: true })).toHaveValue("500");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Tofu", exact: true })).toBeVisible();
  await page.screenshot({ path: fileURLToPath(new URL("inventory-en.png", output)) });
  await page.getByRole("button", { name: "Expiring in 7 days", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Tofu", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Expired", exact: true }).click();
  await expect(page.getByText("No ingredients found", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByRole("button", { name: "Edit Tofu", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Quantity", exact: true })).toHaveValue("500");
  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("250");
  await page.getByRole("textbox", { name: "Expiry date (optional)", exact: true }).fill("");
  await page.getByRole("textbox", { name: "Note", exact: true }).fill("");
  await page.screenshot({ path: fileURLToPath(new URL("editor-en.png", output)) });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("No expiry date", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Edit Tofu", exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await page.evaluate(() => localStorage.setItem("app_locale", "vi"));
  await page.reload();
  await expect(page.getByText("Kho nguyên liệu", { exact: true })).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: fileURLToPath(new URL("inventory-vi.png", output)) });
  await page.getByRole("button", { name: "Sửa Tofu", exact: true }).click();
  await page.getByRole("button", { name: "Xóa nguyên liệu", exact: true }).click();
  await expect(page.getByText("Xóa nguyên liệu này?", { exact: true })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("textbox", { name: "Số lượng", exact: true })).toHaveValue("250");
  await page.getByRole("button", { name: "Xóa nguyên liệu", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xóa nguyên liệu", exact: true })
    .click();
  await expect(page.getByText("Không có nguyên liệu", { exact: true })).toBeVisible();
  assert.deepEqual(
    mutations.map(({ method }) => method),
    ["POST", "PATCH", "DELETE"],
  );
  const final = await context.request.get(`${backendUrl}/api/v1/pantry`, {
    headers: { Authorization: "Bearer user-token" },
  });
  const pantry = (await final.json()).data;
  assert.equal(pantry.userId, TEST_IDS.user);
  assert.deepEqual(pantry.items, []);
  failedReadsRemaining = 3;
  await page.reload();
  await expect(
    page.getByText("Không thể tải kho nguyên liệu. Vui lòng thử lại.", { exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByText("Không có nguyên liệu", { exact: true })).toBeVisible();
  const deletedItemId = mutations
    .find(({ method }) => method === "PATCH")
    .path.split("/")
    .at(-1);
  await page.goto(`${frontendUrl}/pantry/item?itemId=${deletedItemId}`);
  await expect(page.getByText("Nguyên liệu không còn trong kho.", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: "Lưu", exact: true })).toHaveCount(0);
  assert.deepEqual(browserErrors, []);
  console.log(
    "PASS: mobile viewport, English/Vietnamese, validation, failure/retry, add, expiry filters, edit, reload, delete cancellation/confirmation, and authenticated FE-to-BE persistence.",
  );
} catch (error) {
  if (page) {
    await page.screenshot({ path: fileURLToPath(new URL("failure.png", output)) }).catch(() => {});
    console.error((await page.locator("body").innerText()).slice(0, 2500));
  }
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
