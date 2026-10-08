import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { buildTestApp, TEST_TOKENS } from "../helpers/test-app.js";
import { createRecipesModule } from "../../src/modules/recipes/index.js";
import { createPostsModule } from "../../src/modules/posts/index.js";
import { createVideosModule } from "../../src/modules/videos/index.js";
import { createMediaModule } from "../../src/modules/media/index.js";
import { createCommentsModule } from "../../src/modules/comments/index.js";
import { createReactionsModule } from "../../src/modules/reactions/index.js";
import { createRatingsModule } from "../../src/modules/ratings/index.js";
import { createSavedItemsModule } from "../../src/modules/saved-items/index.js";
import { createViewHistoryModule } from "../../src/modules/view-history/index.js";
import { apiManifest } from "../../src/routes/api-manifest.js";
import {
  createMemoryRepositories,
  memoryTransaction,
  newId,
} from "../helpers/memory-repositories.js";

const owner = { userId: "111111111111111111111111", role: "user", status: "active" };
const other = { userId: "222222222222222222222222", role: "user", status: "active" };
const admin = { userId: "333333333333333333333333", role: "admin", status: "active" };
const factories = {
  recipes: createRecipesModule,
  posts: createPostsModule,
  videos: createVideosModule,
  media: createMediaModule,
  comments: createCommentsModule,
  reactions: createReactionsModule,
  ratings: createRatingsModule,
  "saved-items": createSavedItemsModule,
  "view-history": createViewHistoryModule,
};
const createHarness = (seed = {}) => {
  const repositories = createMemoryRepositories(seed);
  let date = new Date("2026-10-03T12:00:00Z");
  const audit = { record: vi.fn(async () => {}) };
  const storageProvider = {
    createUploadUrl: vi.fn(async (input) => ({
      url: `https://storage.test/${input.key}?put`,
      expiresAt: new Date(date.getTime() + input.expiresIn * 1000),
    })),
    getObjectMetadata: vi.fn(async () => ({
      contentType: "image/png",
      contentLength: 100,
      etag: "safe",
    })),
    deleteObject: vi.fn(async () => {}),
    createDownloadUrl: vi.fn(async ({ key }) => ({
      url: `https://storage.test/${key}?signed`,
      expiresAt: new Date(date.getTime() + 300000),
    })),
    getPublicUrl: vi.fn((key) => `https://public.test/${key}`),
  };
  const deps = {
    repositories,
    services: {},
    transaction: memoryTransaction(repositories),
    audit,
    storageProvider,
    env: {
      r2: {
        maxImageSizeBytes: 1000,
        maxVideoSizeBytes: 2000,
        presignedUrlExpiresIn: 120,
        bucketName: "test",
      },
    },
    clock: () => date,
  };
  deps.services.foodItems = {
    getById: (id, options) => repositories.foodItems.findById(id, options),
  };
  const modules = Object.fromEntries(
    Object.entries(factories).map(([name, factory]) => {
      const module = factory(deps);
      Object.assign(deps.services, module.services);
      return [name, module];
    }),
  );
  const call = async (
    module,
    operation,
    { actor = owner, body = {}, params = {}, query = {}, ...extra } = {},
  ) => {
    const validation = modules[module].validation[operation];
    const parsed = { actor, body, params, query, requestId: "content-test", ...extra };
    for (const key of ["body", "params", "query"])
      if (validation[key]) parsed[key] = validation[key].parse(parsed[key]);
    return modules[module].operations[operation](parsed);
  };
  return {
    repositories,
    modules,
    deps,
    call,
    storageProvider,
    audit,
    advance: (milliseconds) => {
      date = new Date(date.getTime() + milliseconds);
    },
  };
};
const published = (extra = {}) => ({
  _id: newId(),
  authorId: owner.userId,
  title: "Healthy content",
  slug: newId(),
  status: "published",
  visibility: "public",
  deletedAt: null,
  version: 0,
  viewCount: 0,
  commentCount: 0,
  reactionCount: 0,
  saveCount: 0,
  ratingCount: 0,
  ratingSum: 0,
  ratingAverage: 0,
  ...extra,
});
const ready = (extra = {}) => ({
  _id: newId(),
  ownerId: owner.userId,
  objectKey: `uploads/${newId()}`,
  kind: "image",
  purpose: "recipe",
  mimeType: "image/png",
  sizeBytes: 100,
  status: "ready",
  references: [],
  deletedAt: null,
  version: 0,
  ...extra,
});

describe("Complete content HTTP flows", () => {
  it("executes every owned API operation through validation/auth/envelopes", async () => {
    const { app, repositories, storageProvider, container } = buildTestApp();
    const api = async (
      method,
      path,
      { token = TEST_TOKENS.user, body, query, status = 200 } = {},
    ) => {
      let req = request(app)[method](`/api/v1${path}`);
      if (token) req = req.set("Authorization", `Bearer ${token}`);
      if (body !== undefined) req = req.send(body);
      if (query) req = req.query(query);
      const response = await req;
      expect(response.status, `${method} ${path}: ${JSON.stringify(response.body)}`).toBe(status);
      expect(response.body.success).toBe(status < 400);
      return response.body;
    };
    const post = (
      await api("post", "/posts", {
        body: { title: "API post", content: "Plant based food" },
        status: 201,
      })
    ).data;
    await api("get", "/posts/mine");
    await api("get", `/posts/${post._id}`);
    await api("patch", `/posts/${post._id}`, { body: { content: "Updated" } });
    await api("post", `/posts/${post._id}/submit`, { body: {} });
    await api("post", `/posts/${post._id}/reject`, {
      token: TEST_TOKENS.admin,
      body: { reason: "Needs references" },
    });
    await api("patch", `/posts/${post._id}`, { body: { content: "Reviewed advice" } });
    await api("post", `/posts/${post._id}/submit`, { body: {} });
    await api("post", `/posts/${post._id}/publish`, { token: TEST_TOKENS.admin, body: {} });
    await api("get", "/posts", { token: null });
    const comment = (
      await api("post", "/comments", {
        body: { targetType: "post", targetId: post._id, content: "Nice" },
        status: 201,
      })
    ).data;
    await api("get", "/comments", {
      token: null,
      query: { targetType: "post", targetId: post._id },
    });
    await api("patch", `/comments/${comment._id}`, { body: { content: "Helpful" } });
    await api("put", `/reactions/post/${post._id}`, { body: { type: "love" } });
    await api("delete", `/reactions/post/${post._id}`);
    await api("put", `/saved-items/post/${post._id}`, { body: {} });
    await api("get", "/saved-items");
    await api("delete", `/saved-items/post/${post._id}`);
    await api("put", `/view-history/post/${post._id}`, { body: {} });
    await api("get", "/view-history");
    await api("delete", `/view-history/post/${post._id}`);
    await api("delete", "/view-history");
    await api("delete", `/comments/${comment._id}`);
    const food = await repositories.foodItems.create({
      name: "Soy",
      slug: "soy",
      status: "active",
      isVegan: true,
      isVegetarian: true,
      nutritionPer100g: { caloriesKcal: 120 },
      allergenIds: [],
    });
    const recipe = (
      await api("post", "/recipes", {
        body: {
          title: "API recipe",
          ingredients: [{ foodItemId: food._id, quantity: 100, unit: "g" }],
          steps: [{ order: 1, instruction: "Cook" }],
        },
        status: 201,
      })
    ).data;
    await api("get", "/recipes/mine");
    await api("get", `/recipes/${recipe.slug}`);
    await api("patch", `/recipes/${recipe._id}`, { body: { summary: "A quick meal" } });
    await api("post", `/recipes/${recipe._id}/submit`, { body: {} });
    await api("post", `/recipes/${recipe._id}/reject`, {
      token: TEST_TOKENS.admin,
      body: { reason: "Improve" },
    });
    await api("post", `/recipes/${recipe._id}/submit`, { body: {} });
    await api("post", `/recipes/${recipe._id}/publish`, { token: TEST_TOKENS.admin, body: {} });
    await api("get", "/recipes", { token: null });
    await api("get", `/recipes/${recipe._id}/nutrition`, { token: null });
    await api("put", `/ratings/recipe/${recipe._id}`, { body: { score: 4, review: "Good" } });
    await api("get", `/ratings/recipe/${recipe._id}/summary`, { token: null });
    await api("delete", `/ratings/recipe/${recipe._id}`);
    const upload = (
      await api("post", "/media/upload-requests", {
        body: { filename: "video.mp4", mimeType: "video/mp4", sizeBytes: 100, purpose: "video" },
        status: 201,
      })
    ).data;
    const asset = await repositories.mediaAssets.findById(upload.assetId);
    storageProvider.objects.set(asset.objectKey, {
      contentType: "video/mp4",
      contentLength: 100,
      etag: "fake",
    });
    await api("get", "/media/mine");
    await api("post", `/media/${asset._id}/confirm`, { body: {} });
    await api("get", `/media/${asset._id}`);
    const video = (
      await api("post", "/videos", {
        body: {
          title: "API video",
          videoMediaId: asset._id,
          durationSeconds: 100,
          transcript: "Cooking tofu",
        },
        status: 201,
      })
    ).data;
    await api("get", "/videos/mine");
    await api("get", `/videos/${video.slug}`);
    await api("patch", `/videos/${video._id}`, { body: { description: "Updated" } });
    await api("post", `/videos/${video._id}/submit`, { body: {} });
    await api("post", `/videos/${video._id}/reject`, {
      token: TEST_TOKENS.admin,
      body: { reason: "Add metadata" },
    });
    await api("post", `/videos/${video._id}/submit`, { body: {} });
    await api("post", `/videos/${video._id}/publish`, { token: TEST_TOKENS.admin, body: {} });
    await api("get", "/videos", { token: null });
    await api("get", `/videos/${video._id}/related`, { token: null });
    await api("get", `/videos/${video._id}/transcript`, { token: null });
    await api("put", `/videos/${video._id}/progress`, { body: { progressSeconds: 90 } });
    container.services.ai.generateVideoSummary = async () => ({
      summary: "Test adapter summary",
      keyPoints: [],
      runId: newId(),
    });
    await api("post", `/videos/${video._id}/generate-summary`, { body: {} });
    await api("delete", `/videos/${video._id}`);
    await api("delete", `/media/${asset._id}`);
    await api("delete", `/recipes/${recipe._id}`);
    await api("delete", `/posts/${post._id}`);
  });
  it("returns secure HTTP errors for missing auth, malformed body, wrong owner, private media and stale versions", async () => {
    const { app } = buildTestApp();
    expect(
      (await request(app).post("/api/v1/posts").send({ title: "No auth", content: "x" })).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/v1/posts")
          .set("Authorization", `Bearer ${TEST_TOKENS.user}`)
          .send({ title: "Invalid", content: "x", status: "published" })
      ).status,
    ).toBe(400);
    const created = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${TEST_TOKENS.user}`)
      .send({ title: "Owner", content: "x" });
    const id = created.body.data._id;
    expect(
      (
        await request(app)
          .post(`/api/v1/posts/${id}/submit`)
          .set("Authorization", `Bearer ${TEST_TOKENS.other}`)
          .send({})
      ).status,
    ).toBe(403);
    expect((await request(app).get(`/api/v1/posts/${id}`)).status).toBe(404);
    expect(
      (
        await request(app)
          .patch(`/api/v1/posts/${id}`)
          .set("Authorization", `Bearer ${TEST_TOKENS.user}`)
          .send({ title: "stale", version: 10 })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post(`/api/v1/posts/${id}/publish`)
          .set("Authorization", `Bearer ${TEST_TOKENS.user}`)
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .put(`/api/v1/ratings/post/${id}`)
          .set("Authorization", `Bearer ${TEST_TOKENS.user}`)
          .send({ score: 5 })
      ).status,
    ).toBe(400);
  });
});

describe("Complete content modules", () => {
  it("exports every owned operation with explicit validation and guarded collection models", () => {
    const h = createHarness();
    for (const route of apiManifest.filter((r) => factories[r.module])) {
      expect(h.modules[route.module].operations[route.operationId], route.operationId).toBeTypeOf(
        "function",
      );
      expect(
        h.modules[route.module].validation[route.operationId],
        route.operationId,
      ).toBeDefined();
    }
    expect(
      Object.values(h.modules).flatMap((m) =>
        Object.values(m.models).map((model) => model.collection.name),
      ),
    ).toEqual([
      "recipes",
      "posts",
      "videos",
      "media",
      "comments",
      "reactions",
      "ratings",
      "saveditems",
      "viewhistories",
    ]);
    for (const factory of Object.values(factories)) expect(() => factory(h.deps)).not.toThrow();
  });
  it("rejects unknown fields, forged owners/counters/status, invalid IDs and target types", async () => {
    const h = createHarness();
    await expect(
      h.call("recipes", "createRecipe", { body: { title: "T", authorId: other.userId } }),
    ).rejects.toThrow();
    await expect(
      h.call("posts", "createPost", {
        body: { title: "T", content: "text", status: "published", saveCount: 100 },
      }),
    ).rejects.toThrow();
    await expect(
      h.call("ratings", "upsertRating", {
        params: { targetType: "post", targetId: newId() },
        body: { score: 5 },
      }),
    ).rejects.toThrow();
    await expect(
      h.call("posts", "updatePost", { params: { id: "not-id" }, body: { content: "x" } }),
    ).rejects.toThrow();
    await expect(
      h.call("videos", "createVideo", {
        body: { title: "T", videoMediaId: newId(), durationSeconds: Infinity },
      }),
    ).rejects.toThrow();
    await expect(
      h.call("recipes", "updateRecipe", { params: { id: newId() }, body: { version: 0 } }),
    ).rejects.toThrow();
  });
  it("enforces owner/admin lifecycle, rejects unpublished public reads, audits admin transitions", async () => {
    const h = createHarness();
    const draft = await h.call("posts", "createPost", {
      body: { title: "A post", content: "Nutrition advice" },
    });
    await expect(
      h.call("posts", "submitPost", { actor: other, params: { id: draft._id } }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect((await h.call("posts", "getPosts", { actor: null })).data).toHaveLength(0);
    await expect(
      h.call("posts", "getPost", { actor: null, params: { id: draft._id } }),
    ).rejects.toMatchObject({ statusCode: 404 });
    const submitted = await h.call("posts", "submitPost", {
      params: { id: draft._id },
      body: { version: 0 },
    });
    expect(submitted.status).toBe("pending_review");
    await expect(
      h.call("posts", "updatePost", { params: { id: draft._id }, body: { content: "Change" } }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      h.call("posts", "publishPost", { params: { id: draft._id } }),
    ).rejects.toMatchObject({ statusCode: 403 });
    const result = await h.call("posts", "publishPost", {
      actor: admin,
      params: { id: draft._id },
      body: { version: 1 },
    });
    expect(result.status).toBe("published");
    expect(h.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "post.publish", session: expect.anything() }),
    );
    expect((await h.call("posts", "getPosts", { actor: null })).data).toHaveLength(1);
    await h.deps.services.content.setVisibility("post", draft._id, { actor: admin, hidden: true });
    await expect(
      h.call("posts", "getPost", { actor: null, params: { id: draft._id } }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await h.deps.services.content.setVisibility({
      targetType: "post",
      targetId: draft._id,
      actor: admin,
      hidden: false,
    });
    await h.call("posts", "deletePost", { params: { id: draft._id } });
    expect((await h.call("posts", "getPosts", { actor: null })).data).toHaveLength(0);
  });
  it("never overlaps repository calls on the same transaction session", async () => {
    const foods = [newId(), newId()];
    const assets = [ready(), ready()];
    const h = createHarness({
      foodItems: foods.map((_id) => ({
        _id,
        name: "Food",
        status: "active",
        isVegan: true,
        nutritionPer100g: { caloriesKcal: 100 },
      })),
      mediaAssets: assets,
    });
    let active = 0;
    const wrap = (repository, method) => {
      const original = repository[method].bind(repository);
      repository[method] = async (...args) => {
        const options = args[args.length - 1];
        if (!options?.session) return original(...args);
        expect(active, `${method} overlaps another session operation`).toBe(0);
        active++;
        try {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return await original(...args);
        } finally {
          active--;
        }
      };
    };
    for (const repository of [h.repositories.foodItems, h.repositories.mediaAssets]) {
      wrap(repository, "findById");
      wrap(repository, "updateOne");
    }
    await h.call("recipes", "createRecipe", {
      body: {
        title: "Sequential",
        ingredients: foods.map((foodItemId) => ({ foodItemId, quantity: 100, unit: "g" })),
        mediaIds: assets.map((asset) => asset._id),
      },
    });
    await h.deps.transaction((session) =>
      h.deps.services.media.assertReady(
        assets.map((asset) => asset._id),
        { actor: owner, session },
      ),
    );
    const lookupRecipes = [
      await h.repositories.recipes.create(published()),
      await h.repositories.recipes.create(published()),
    ];
    wrap(h.repositories.recipes, "findOne");
    await h.deps.transaction((session) =>
      h.deps.services.recipes.getMany(
        lookupRecipes.map((item) => item._id),
        { session, publicOnly: true },
      ),
    );
    expect(active).toBe(0);
  });
  it("snapshots food nutrition/allergens, filters diet, and preserves snapshots until ingredients change", async () => {
    const foodId = newId(),
      allergen = newId();
    const h = createHarness({
      foodItems: [
        {
          _id: foodId,
          name: "Tofu",
          status: "active",
          isVegan: true,
          isVegetarian: true,
          nutritionPer100g: { caloriesKcal: 100, proteinG: 10 },
          allergenIds: [allergen],
        },
      ],
    });
    const recipe = await h.call("recipes", "createRecipe", {
      body: {
        title: "Tofu",
        servings: 2,
        ingredients: [{ foodItemId: foodId, quantity: 200, unit: "g" }],
        steps: [{ order: 1, instruction: "Cook" }],
        prepMinutes: 5,
        cookMinutes: 10,
      },
    });
    expect(recipe.nutritionPerServing.caloriesKcal).toBe(100);
    expect(recipe.allergenIds).toEqual([allergen]);
    expect(recipe.ingredients[0].foodNameSnapshot).toBe("Tofu");
    await h.repositories.foodItems.updateOne(
      { _id: foodId },
      { $set: { name: "Changed", nutritionPer100g: { caloriesKcal: 900 }, allergenIds: [] } },
    );
    const changed = await h.call("recipes", "updateRecipe", {
      params: { id: recipe._id },
      body: { servings: 4, version: 0 },
    });
    expect(changed.nutritionPerServing.caloriesKcal).toBe(50);
    expect(changed.allergenIds).toEqual([allergen]);
    await expect(
      h.call("recipes", "updateRecipe", {
        params: { id: recipe._id },
        body: { title: "stale", version: 0 },
      }),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT" });
    await h.call("recipes", "submitRecipe", { params: { id: recipe._id } });
    await h.call("recipes", "publishRecipe", { actor: admin, params: { id: recipe._id } });
    expect(
      (
        await h.call("recipes", "getRecipes", {
          query: { dietType: "vegan", maxTotalMinutes: "15" },
        })
      ).data,
    ).toHaveLength(1);
    expect(
      (await h.call("recipes", "getRecipes", { query: { excludeAllergenIds: allergen } })).data,
    ).toHaveLength(0);
    expect(
      (await h.call("recipes", "getRecipeNutrition", { params: { id: recipe._id } }))
        .nutritionPerServing.caloriesKcal,
    ).toBe(50);
  });
  it("requires owner-ready media, generates opaque pending IDs, confirms HEAD and never leaks public/private keys", async () => {
    const h = createHarness();
    await expect(
      h.call("media", "createUploadRequest", {
        body: { filename: "x.svg", mimeType: "image/svg+xml", sizeBytes: 100, purpose: "avatar" },
      }),
    ).rejects.toThrow();
    await expect(
      h.call("media", "createUploadRequest", {
        body: { filename: "x.png", mimeType: "image/png", sizeBytes: 1001, purpose: "avatar" },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    const upload = await h.call("media", "createUploadRequest", {
      body: {
        filename: "../../secret.png",
        mimeType: "image/png",
        sizeBytes: 100,
        purpose: "recipe",
      },
    });
    expect(upload.assetId).toMatch(/^[a-f\d]{24}$/);
    expect(upload.uploadUrl).not.toContain("secret");
    expect(upload.expiresIn).toBe(120);
    await expect(
      h.call("recipes", "createRecipe", {
        body: { title: "Pending", coverMediaId: upload.assetId },
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      h.call("media", "confirmMediaUpload", { actor: other, params: { id: upload.assetId } }),
    ).rejects.toMatchObject({ statusCode: 403 });
    const media = await h.call("media", "confirmMediaUpload", { params: { id: upload.assetId } });
    expect(media.status).toBe("ready");
    expect(media.url).toContain("?signed");
    expect(media.objectKey).toBeUndefined();
    expect(media.publicUrl).toBeUndefined();
    expect(h.storageProvider.getPublicUrl).not.toHaveBeenCalled();
    await expect(
      h.call("media", "getMediaAsset", { actor: null, params: { id: upload.assetId } }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      h.call("recipes", "createRecipe", {
        actor: other,
        body: { title: "Steal", coverMediaId: upload.assetId },
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    const recipe = await h.call("recipes", "createRecipe", {
      body: { title: "Private", coverMediaId: upload.assetId },
    });
    await expect(
      h.call("media", "deleteMediaAsset", { params: { id: upload.assetId } }),
    ).rejects.toMatchObject({ code: "MEDIA_IN_USE" });
    await h.call("recipes", "deleteRecipe", { params: { id: recipe._id } });
    expect(
      await h.call("media", "deleteMediaAsset", { params: { id: upload.assetId } }),
    ).toMatchObject({ status: "deleted" });
  });
  it("rejects mismatched HEAD metadata and safely recovers failed storage deletion", async () => {
    const h = createHarness();
    const input = { filename: "img.png", mimeType: "image/png", sizeBytes: 100, purpose: "other" };
    const bad = await h.call("media", "createUploadRequest", { body: input });
    h.storageProvider.getObjectMetadata.mockResolvedValueOnce({
      contentType: "image/png",
      contentLength: 99,
    });
    await expect(
      h.call("media", "confirmMediaUpload", { params: { id: bad.assetId } }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect((await h.repositories.mediaAssets.findById(bad.assetId)).status).toBe("rejected");
    const upload = await h.call("media", "createUploadRequest", { body: input });
    await h.call("media", "confirmMediaUpload", { params: { id: upload.assetId } });
    h.storageProvider.deleteObject.mockRejectedValueOnce(new Error("provider failure"));
    await expect(
      h.call("media", "deleteMediaAsset", { params: { id: upload.assetId } }),
    ).rejects.toThrow("provider failure");
    expect((await h.repositories.mediaAssets.findById(upload.assetId)).status).toBe("deleting");
    await expect(
      h.deps.services.media.link(upload.assetId, "post", newId(), { actor: owner }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(
      await h.call("media", "deleteMediaAsset", { params: { id: upload.assetId } }),
    ).toMatchObject({ status: "deleted" });
  });
  it("authorizes public media from real references, catches stale missing links, and fails closed without signed GET", async () => {
    const asset = ready({ purpose: "post" });
    const post = published({ content: "A", mediaIds: [asset._id] });
    const h = createHarness({ mediaAssets: [asset], posts: [post] });
    expect(
      (await h.call("media", "getMediaAsset", { actor: null, params: { id: asset._id } }))
        .downloadUrl,
    ).toContain("?signed");
    await expect(
      h.call("media", "deleteMediaAsset", { params: { id: asset._id } }),
    ).rejects.toMatchObject({ code: "MEDIA_IN_USE" });
    delete h.deps.storageProvider.createDownloadUrl;
    await expect(
      h.call("media", "getMediaAsset", { actor: null, params: { id: asset._id } }),
    ).rejects.toMatchObject({ statusCode: 503 });
  });
  it("validates polymorphic targets and depth-one replies, keeps counters through delete/hide/restore", async () => {
    const post = published({ content: "A" });
    const h = createHarness({ posts: [post] });
    await expect(
      h.call("comments", "createComment", {
        body: { targetType: "video", targetId: post._id, content: "bad" },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    const root = await h.call("comments", "createComment", {
      body: { targetType: "post", targetId: post._id, content: "root" },
    });
    const reply = await h.call("comments", "createComment", {
      actor: other,
      body: { targetType: "post", targetId: post._id, parentCommentId: root._id, content: "reply" },
    });
    await expect(
      h.call("comments", "createComment", {
        body: {
          targetType: "post",
          targetId: post._id,
          parentCommentId: reply._id,
          content: "depth2",
        },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      h.call("comments", "updateComment", {
        actor: other,
        params: { id: root._id },
        body: { content: "stolen" },
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect((await h.repositories.posts.findById(post._id)).commentCount).toBe(2);
    await h.deps.services.content.setVisibility("comment", root._id, {
      actor: admin,
      hidden: true,
    });
    expect((await h.repositories.posts.findById(post._id)).commentCount).toBe(0);
    expect(
      (
        await h.call("comments", "getComments", {
          query: { targetType: "post", targetId: post._id },
        })
      ).data,
    ).toHaveLength(0);
    expect(
      await h.deps.services.content.getTarget("comment", root._id, {
        actor: admin,
        publicOnly: false,
      }),
    ).toMatchObject({ status: "hidden" });
    await expect(
      h.deps.services.content.getTarget("comment", root._id, { publicOnly: true }),
    ).rejects.toMatchObject({ statusCode: 404 });
    await h.deps.services.content.setVisibility("comment", root._id, {
      actor: admin,
      hidden: false,
    });
    expect((await h.repositories.posts.findById(post._id)).commentCount).toBe(2);
    await h.call("comments", "deleteComment", { params: { id: root._id } });
    expect((await h.repositories.posts.findById(post._id)).commentCount).toBe(0);
    expect((await h.repositories.comments.findById(reply._id)).status).toBe("deleted");
  });
  it("maintains unique idempotent saves/reactions and actual transactional rating averages", async () => {
    const recipe = published();
    const h = createHarness({ recipes: [recipe] });
    const params = { targetType: "recipe", targetId: recipe._id };
    await Promise.all(
      Array.from({ length: 8 }, () => h.call("saved-items", "saveItem", { params })),
    );
    expect(await h.repositories.savedItems.count({})).toBe(1);
    expect((await h.repositories.recipes.findById(recipe._id)).saveCount).toBe(1);
    await h.call("reactions", "upsertReaction", { params, body: { type: "like" } });
    await h.call("reactions", "upsertReaction", { params, body: { type: "love" } });
    expect((await h.repositories.recipes.findById(recipe._id)).reactionCount).toBe(1);
    await h.call("ratings", "upsertRating", { params, body: { score: 5 } });
    await h.call("ratings", "upsertRating", { actor: other, params, body: { score: 3 } });
    await h.call("ratings", "upsertRating", { params, body: { score: 1, review: "Changed" } });
    const target = await h.repositories.recipes.findById(recipe._id);
    expect(target.ratingCount).toBe(2);
    expect(target.ratingSum).toBe(4);
    expect(target.ratingAverage).toBe(2);
    const summary = await h.call("ratings", "getRatingSummary", { params });
    expect(summary).toMatchObject({ count: 2, average: 2, myRating: { score: 1 } });
    expect(summary.distribution).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0, 5: 0 });
    await h.call("ratings", "deleteRating", { params });
    await h.call("ratings", "deleteRating", { params });
    expect((await h.repositories.recipes.findById(recipe._id)).ratingAverage).toBe(3);
    await h.call("saved-items", "unsaveItem", { actor: other, params });
    expect((await h.repositories.recipes.findById(recipe._id)).saveCount).toBe(1);
    await h.call("saved-items", "unsaveItem", { params });
    await h.call("saved-items", "unsaveItem", { params });
    expect((await h.repositories.recipes.findById(recipe._id)).saveCount).toBe(0);
  });
  it("keeps owner-scoped bookmarks idempotent on standalone MongoDB", async () => {
    const recipe = published();
    const h = createHarness({ recipes: [recipe] });
    const params = { targetType: "recipe", targetId: recipe._id };
    delete h.deps.transaction;
    await h.call("saved-items", "saveItem", { params });
    await h.call("saved-items", "saveItem", { params });
    expect(await h.repositories.savedItems.count({ userId: owner.userId })).toBe(1);
    expect((await h.repositories.recipes.findById(recipe._id)).saveCount).toBe(1);
    expect((await h.call("saved-items", "getSavedItems")).data).toHaveLength(1);
    await h.call("saved-items", "unsaveItem", { params });
    await h.call("saved-items", "unsaveItem", { params });
    expect(await h.repositories.savedItems.count({ userId: owner.userId })).toBe(0);
    expect((await h.repositories.recipes.findById(recipe._id)).saveCount).toBe(0);
  });
  it("saves active food items without requiring a content counter", async () => {
    const foodItem = {
      _id: newId(),
      name: "Chickpeas",
      slug: "chickpeas",
      status: "active",
      imageUrl: "https://images.test/chickpeas.jpg",
      isVegan: true,
      isVegetarian: true,
    };
    const h = createHarness({ foodItems: [foodItem] });
    const params = { targetType: "food-item", targetId: foodItem._id };

    await h.call("saved-items", "saveItem", { params });
    await h.call("saved-items", "saveItem", { params });

    const saved = await h.call("saved-items", "getSavedItems", {
      query: { targetType: "food-item" },
    });
    expect(saved.data).toHaveLength(1);
    expect(saved.data[0]).toMatchObject({
      targetType: "food-item",
      targetId: foodItem._id,
      target: { name: "Chickpeas", status: "active" },
    });

    await h.call("saved-items", "unsaveItem", { params });
    expect(await h.repositories.savedItems.count({ userId: owner.userId })).toBe(0);
  });
  it("does not expose inactive food items through saved items", async () => {
    const foodItem = {
      _id: newId(),
      name: "Unavailable food",
      slug: "unavailable-food",
      status: "inactive",
      isVegan: true,
      isVegetarian: true,
    };
    const h = createHarness({ foodItems: [foodItem] });

    await expect(
      h.call("saved-items", "saveItem", {
        params: { targetType: "food-item", targetId: foodItem._id },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
  it("compensates standalone bookmark writes when the counter update fails", async () => {
    const recipe = published();
    const h = createHarness({ recipes: [recipe] });
    const params = { targetType: "recipe", targetId: recipe._id };
    delete h.deps.transaction;
    const adjustCounters = h.deps.services.content.adjustCounters;
    h.deps.services.content.adjustCounters = vi.fn(async () => {
      throw new Error("counter unavailable");
    });
    await expect(h.call("saved-items", "saveItem", { params })).rejects.toThrow(
      "counter unavailable",
    );
    expect(await h.repositories.savedItems.count({ userId: owner.userId })).toBe(0);

    h.deps.services.content.adjustCounters = adjustCounters;
    await h.call("saved-items", "saveItem", { params });
    h.deps.services.content.adjustCounters = vi.fn(async () => {
      throw new Error("counter unavailable");
    });
    await expect(h.call("saved-items", "unsaveItem", { params })).rejects.toThrow(
      "counter unavailable",
    );
    expect(await h.repositories.savedItems.count({ userId: owner.userId })).toBe(1);
  });
  it("rolls back an interaction when its target counter write fails", async () => {
    const post = published();
    const h = createHarness({ posts: [post] });
    const original = h.repositories.posts.updateOne;
    h.repositories.posts.updateOne = vi.fn(async () => null);
    await expect(
      h.call("reactions", "upsertReaction", {
        params: { targetType: "post", targetId: post._id },
        body: { type: "like" },
      }),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT" });
    expect(await h.repositories.reactions.count({})).toBe(0);
    h.repositories.posts.updateOne = original;
  });
  it("records owner-specific video progress and deduped views even after history deletion", async () => {
    const asset = ready({ kind: "video", purpose: "video", mimeType: "video/mp4" });
    const video = published({ videoMediaId: asset._id, durationSeconds: 100 });
    const h = createHarness({ mediaAssets: [asset], videos: [video] });
    const params = { id: video._id };
    await h.call("videos", "updateVideoProgress", { params, body: { progressSeconds: 50 } });
    await h.call("videos", "updateVideoProgress", { params, body: { progressSeconds: 60 } });
    expect((await h.repositories.videos.findById(video._id)).viewCount).toBe(1);
    const theirs = await h.call("videos", "getVideo", {
      actor: other,
      params: { idOrSlug: video._id },
    });
    expect(theirs.progress).toBeNull();
    const mine = await h.call("videos", "getVideo", { params: { idOrSlug: video._id } });
    expect(mine.progress.progressSeconds).toBe(60);
    expect(mine.viewReceipts).toBeUndefined();
    await expect(
      h.call("videos", "updateVideoProgress", { params, body: { progressSeconds: 101 } }),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      h.call("videos", "updateVideoProgress", {
        params,
        body: { progressSeconds: 20, completed: true },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    await h.call("view-history", "clearViewHistory");
    expect((await h.call("view-history", "getViewHistory")).data).toHaveLength(0);
    await h.call("view-history", "recordView", {
      params: { targetType: "video", targetId: video._id },
    });
    expect((await h.repositories.videos.findById(video._id)).viewCount).toBe(1);
    h.advance(31 * 60000);
    await h.call("videos", "updateVideoProgress", {
      params,
      body: { progressSeconds: 95, completed: true },
    });
    expect((await h.repositories.videos.findById(video._id)).viewCount).toBe(2);
    await h.call("videos", "updateVideoProgress", {
      actor: other,
      params,
      body: { progressSeconds: 10 },
    });
    await h.call("view-history", "clearViewHistory");
    expect((await h.call("view-history", "getViewHistory", { actor: other })).data).toHaveLength(1);
  });
  it("redacts related recipe internals and fences a comment's visibility dependencies", async () => {
    const recipe = published({
      ratingSum: 4,
      rejectionReason: "private",
      viewReceipts: [{ key: "private-hash", at: new Date() }],
    });
    const video = published({ recipeId: recipe._id, durationSeconds: 100 });
    const post = published();
    const root = {
      _id: newId(),
      authorId: owner.userId,
      targetType: "post",
      targetId: post._id,
      status: "visible",
      content: "root",
      parentCommentId: null,
      version: 0,
      deletedAt: null,
    };
    const reply = { ...root, _id: newId(), parentCommentId: root._id };
    const h = createHarness({
      recipes: [recipe],
      videos: [video],
      posts: [post],
      comments: [root, reply],
    });
    const related = await h.call("videos", "getRelatedVideos", { params: { id: video._id } });
    expect(related.meta.recipe.viewReceipts).toBeUndefined();
    expect(related.meta.recipe.ratingSum).toBeUndefined();
    expect(related.meta.recipe.rejectionReason).toBeUndefined();
    const update = vi.spyOn(h.repositories.posts, "updateOne");
    const parentUpdate = vi.spyOn(h.repositories.comments, "updateOne");
    await h.call("reactions", "upsertReaction", {
      params: { targetType: "comment", targetId: reply._id },
      body: { type: "like" },
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ _id: post._id }),
      expect.objectContaining({ $inc: { version: 1 } }),
      expect.objectContaining({ session: expect.anything() }),
    );
    expect(parentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: root._id }),
      expect.objectContaining({ $inc: { version: 1 } }),
      expect.objectContaining({ session: expect.anything() }),
    );
  });
  it("requires ready video media, verifies chapters and delegates real AI summary", async () => {
    const pending = ready({
      status: "pending",
      kind: "video",
      purpose: "video",
      mimeType: "video/mp4",
    });
    const h = createHarness({ mediaAssets: [pending] });
    await expect(
      h.call("videos", "createVideo", {
        body: { title: "Video", videoMediaId: pending._id, durationSeconds: 100 },
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await h.repositories.mediaAssets.updateOne({ _id: pending._id }, { $set: { status: "ready" } });
    await expect(
      h.call("videos", "createVideo", {
        body: {
          title: "Video",
          videoMediaId: pending._id,
          durationSeconds: 100,
          chapters: [{ title: "Intro", startSeconds: 0, endSeconds: 101 }],
        },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    const video = await h.call("videos", "createVideo", {
      body: {
        title: "Video",
        videoMediaId: pending._id,
        durationSeconds: 100,
        transcript: "Actual cooking steps",
      },
    });
    h.deps.services.ai = {
      generateVideoSummary: vi.fn(async () => ({
        summary: "Real summary",
        runId: newId(),
        keyPoints: [],
      })),
    };
    await h.call("videos", "generateVideoSummaryFromVideoId", { params: { id: video._id } });
    expect((await h.repositories.videos.findById(video._id)).summary).toBe("Real summary");
    await expect(
      h.deps.services.videos.updateSummary(
        video._id,
        { chapters: [{ title: "Incomplete", startSeconds: 0 }] },
        { actor: owner },
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      h.deps.services.videos.updateSummary(
        video._id,
        { chapters: [{ title: "Nonfinite", startSeconds: 0, endSeconds: NaN }] },
        { actor: owner },
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(h.deps.services.ai.generateVideoSummary).toHaveBeenCalledWith(
      expect.objectContaining({ body: { videoId: video._id } }),
    );
    await expect(
      h.call("videos", "generateVideoSummaryFromVideoId", {
        actor: other,
        params: { id: video._id },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
