import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import { buildTestApp, TEST_IDS, TEST_TOKENS, bearer } from "../helpers/test-app.js";

const id = (n) => n.toString(16).padStart(24, "0");
const recipe = (n, extra = {}) => ({
  _id: id(n),
  slug: `recipe-${n}`,
  title: `Recipe ${n}`,
  authorId: TEST_IDS.user,
  status: "published",
  visibility: "public",
  deletedAt: null,
  isVegan: true,
  isVegetarian: true,
  viewCount: 1,
  createdAt: new Date("2026-10-01"),
  publishedAt: new Date("2026-10-01"),
  ...extra,
});
const diets = [
  "vegan",
  "vegetarian",
  "lacto_vegetarian",
  "ovo_vegetarian",
  "lacto_ovo_vegetarian",
  "pescatarian",
  "flexitarian",
  "other",
];

describe("audit discovery regressions", () => {
  it("popular pagination uses the same tie breakers across collections and pages", async () => {
    const { app } = buildTestApp({
      seed: {
        recipes: [recipe(1, { createdAt: new Date("2026-10-02") }), recipe(2)],
        videos: [recipe(3, { createdAt: new Date("2026-09-30") })],
      },
    });
    const ids = [];
    for (const page of [1, 2, 3]) {
      const res = await request(app)
        .get("/api/v1/search")
        .query({ sort: "popular", limit: 1, page });
      expect(res.status).toBe(200);
      ids.push(res.body.data[0]._id);
    }
    expect(ids).toEqual([id(1), id(2), id(3)]);
  });
  it.each(["search", "admin/content/pending"])(
    "%s makes every advertised page accessible",
    async (path) => {
      const { app } = buildTestApp({
        seed: {
          recipes: Array.from({ length: 1001 }, (_, i) =>
            recipe(
              i + 1,
              path.startsWith("admin")
                ? { status: "pending_review", createdAt: new Date("2026-01-01") }
                : {},
            ),
          ),
        },
      });
      const first = await request(app)
        .get(`/api/v1/${path}`)
        .set(bearer(TEST_TOKENS.admin))
        .query({ limit: 50, page: 20, type: "recipe" });
      expect(first.status).toBe(200);
      expect(first.body.meta.totalPages).toBe(21);
      const last = await request(app)
        .get(`/api/v1/${path}`)
        .set(bearer(TEST_TOKENS.admin))
        .query({ limit: 50, page: 21, type: "recipe" });
      expect(last.status).toBe(200);
      expect(last.body.data).toHaveLength(1);
    },
  );
  it("pending queue includes old content by default and honors explicit date bounds", async () => {
    const { app } = buildTestApp({
      seed: {
        recipes: [
          recipe(1, { status: "pending_review", createdAt: new Date("2026-01-01") }),
          recipe(2, { status: "pending_review" }),
        ],
      },
    });
    const get = (query) =>
      request(app).get("/api/v1/admin/content/pending").set(bearer(TEST_TOKENS.admin)).query(query);
    expect((await get({})).body.data.map((r) => r._id)).toEqual([id(1), id(2)]);
    expect((await get({ from: "2026-09-01" })).body.data.map((r) => r._id)).toEqual([id(2)]);
    expect((await get({ to: "2026-02-01" })).body.data.map((r) => r._id)).toEqual([id(1)]);
  });
  it.each(diets)(
    "%s has consistent browse, search, recommendation and food eligibility",
    async (dietType) => {
      const { app } = buildTestApp({
        seed: {
          recipes: [recipe(1)],
          foodItems: [
            { _id: id(10), name: "Tofu", status: "active", isVegan: true, isVegetarian: true },
          ],
          userProfiles: [{ userId: TEST_IDS.user, dietType }],
        },
      });
      const browse = await request(app).get("/api/v1/recipes").query({ dietType });
      const search = await request(app).get("/api/v1/search").query({ type: "recipe", dietType });
      const foods = await request(app).get("/api/v1/search").query({ type: "food-item", dietType });
      const recommended = await request(app)
        .get("/api/v1/recommendations/recipes")
        .set(bearer(TEST_TOKENS.user));
      for (const response of [browse, search, foods, recommended]) {
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
      }
    },
  );
  it("search projects only card fields before transferring results", async () => {
    const { app, repositories } = buildTestApp({
      seed: { recipes: [recipe(1, { steps: [{ instruction: "large" }], description: "visible" })] },
    });
    const aggregate = vi.spyOn(repositories.recipes, "aggregate");
    expect((await request(app).get("/api/v1/search").query({ type: "recipe" })).status).toBe(200);
    const projection = aggregate.mock.calls[0][0].find((stage) => stage.$project).$project;
    expect(projection).not.toHaveProperty("steps");
    expect(projection).not.toHaveProperty("transcript");
  });
});

const media = (n, extra = {}) => ({
  _id: id(n),
  ownerId: TEST_IDS.user,
  objectKey: `users/${TEST_IDS.user}/avatar/${n}.jpg`,
  bucket: "private",
  kind: "image",
  purpose: "avatar",
  mimeType: "image/jpeg",
  sizeBytes: 10,
  status: "ready",
  deletedAt: null,
  references: [],
  ...extra,
});
describe("expired media cleanup", () => {
  const administrator = { userId: TEST_IDS.admin, role: "admin", status: "active" };
  const expired = (n, extra = {}) =>
    media(n, {
      status: "pending",
      createdAt: new Date("2026-09-01"),
      uploadExpiresAt: new Date("2026-09-01T00:05:00Z"),
      ...extra,
    });
  const setup = (assets) => {
    const value = buildTestApp({ seed: { mediaAssets: assets } });
    value.env.r2.bucketName = "private";
    return value;
  };
  it("requires explicit broader scope, inventories without writes, and preserves referenced/ready/fresh objects", async () => {
    const { container, repositories, storageProvider } = setup([
      expired(10),
      expired(11, { status: "rejected" }),
      expired(12, { status: "deleting" }),
      expired(13, { status: "ready" }),
      expired(14, { references: [{ entityType: "post", entityId: id(1) }] }),
      expired(15, { createdAt: new Date("2026-10-03T11:00:00Z") }),
      expired(16, { objectKey: "outside/namespace.jpg" }),
      expired(17, { bucket: "another" }),
    ]);
    const remove = vi.spyOn(storageProvider, "deleteObject");
    const cleanup = container.services.media.cleanupPending;
    expect((await cleanup({ actor: administrator })).candidates).toBe(0);
    expect((await cleanup({ actor: administrator, ownerId: TEST_IDS.user })).deleted).toBe(0);
    expect(remove).not.toHaveBeenCalled();
    const result = await cleanup({ actor: administrator, allOwners: true, apply: true });
    expect(result).toMatchObject({ deleted: 3, skipped: 2, failed: 0 });
    for (const n of [13, 14, 15, 16, 17])
      expect((await repositories.mediaAssets.findById(id(n))).status).not.toBe("deleted");
    expect((await cleanup({ actor: administrator, allOwners: true, apply: true })).deleted).toBe(0);
    expect(await repositories.auditLogs.count({ action: "media.cleanup.claim" })).toBe(3);
  });
  it("retries failed object deletion without losing the metadata", async () => {
    const { container, repositories, storageProvider } = setup([expired(10)]);
    vi.spyOn(storageProvider, "deleteObject").mockRejectedValueOnce(new Error("storage offline"));
    const options = { actor: administrator, ownerId: TEST_IDS.user, apply: true };
    expect((await container.services.media.cleanupPending(options)).failed).toBe(1);
    expect((await repositories.mediaAssets.findById(id(10))).status).toBe("deleting");
    expect((await container.services.media.cleanupPending(options)).deleted).toBe(1);
  });
  it("does not delete a pending object confirmed after inventory", async () => {
    const { container, repositories, storageProvider } = setup([expired(10)]);
    const find = repositories.mediaAssets.findMany.bind(repositories.mediaAssets);
    vi.spyOn(repositories.mediaAssets, "findMany").mockImplementationOnce(async (...args) => {
      const snapshot = await find(...args);
      await repositories.mediaAssets.updateOne(
        { _id: id(10) },
        { $set: { status: "ready" }, $inc: { version: 1 } },
      );
      return snapshot;
    });
    const remove = vi.spyOn(storageProvider, "deleteObject");
    expect(
      (
        await container.services.media.cleanupPending({
          actor: administrator,
          allOwners: true,
          apply: true,
        })
      ).skipped,
    ).toBe(1);
    expect(remove).not.toHaveBeenCalled();
  });
});
describe("avatar R2 lifecycle", () => {
  it("links ready media, refreshes signed URLs, blocks deletion, and releases old references", async () => {
    const { app, repositories, storageProvider } = buildTestApp({
      seed: { mediaAssets: [media(10), media(11)] },
    });
    let signature = 0;
    storageProvider.createDownloadUrl = async () => ({
      url: `https://r2.example/avatar?signature=${++signature}`,
      expiresAt: new Date("2026-10-03T12:05:00Z"),
    });
    const patch = (body) =>
      request(app).patch("/api/v1/users/me").set(bearer(TEST_TOKENS.user)).send(body);
    const linked = await patch({ avatarMediaId: id(10) });
    expect(linked.status).toBe(200);
    expect(linked.body.data.avatarMediaId).toBe(id(10));
    expect(linked.body.data.avatarUrl).toContain("signature=1");
    const stored = await repositories.users.findById(TEST_IDS.user);
    expect(stored.avatarUrl).toBeNull();
    const publicProfile = await request(app).get(`/api/v1/users/${TEST_IDS.user}/public`);
    expect(publicProfile.status).toBe(200);
    expect(publicProfile.body.data.avatarUrl).toContain("signature=2");
    expect(
      (
        await request(app)
          .delete(`/api/v1/media/${id(10)}`)
          .set(bearer(TEST_TOKENS.user))
      ).status,
    ).toBe(409);
    expect((await patch({ avatarMediaId: id(11) })).status).toBe(200);
    expect((await repositories.mediaAssets.findById(id(10))).references).toEqual([]);
    expect((await repositories.mediaAssets.findById(id(11))).references).toHaveLength(1);
    expect((await patch({ avatarMediaId: null })).status).toBe(200);
    expect((await repositories.mediaAssets.findById(id(11))).references).toEqual([]);
    expect(
      (
        await request(app)
          .delete(`/api/v1/media/${id(10)}`)
          .set(bearer(TEST_TOKENS.user))
      ).status,
    ).toBe(200);
  });
  it.each([
    [{ ownerId: TEST_IDS.other }, 403],
    [{ status: "pending" }, 409],
    [{ kind: "video" }, 400],
    [{ purpose: "recipe" }, 400],
  ])("rejects invalid avatar media %o", async (extra, status) => {
    const { app, repositories } = buildTestApp({ seed: { mediaAssets: [media(10, extra)] } });
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ avatarMediaId: id(10) });
    expect(res.status).toBe(status);
    expect((await repositories.users.findById(TEST_IDS.user)).avatarMediaId).toBeUndefined();
  });
  it("rejects arbitrary URLs and unlinks avatar on account deletion", async () => {
    const { app, repositories } = buildTestApp({ seed: { mediaAssets: [media(10)] } });
    expect(
      (
        await request(app)
          .patch("/api/v1/users/me")
          .set(bearer(TEST_TOKENS.user))
          .send({ avatarUrl: "https://arbitrary.example/a.jpg" })
      ).status,
    ).toBe(400);
    await request(app)
      .patch("/api/v1/users/me")
      .set(bearer(TEST_TOKENS.user))
      .send({ avatarMediaId: id(10) });
    expect(
      (await request(app).delete("/api/v1/users/me").set(bearer(TEST_TOKENS.user)).send({})).status,
    ).toBe(200);
    expect((await repositories.mediaAssets.findById(id(10))).references).toEqual([]);
  });
});
