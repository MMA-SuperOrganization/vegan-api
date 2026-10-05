import fs from "node:fs";
import { promisify } from "node:util";
import { execFile, fork } from "node:child_process";
import { once } from "node:events";
import { performance } from "node:perf_hooks";
import {
  test,
  expect,
  cases,
  ID,
  TEST_IDS,
  TEST_TOKENS,
  NOW,
  content,
  openHarness,
  document,
} from "./fixtures.js";
import { database } from "./database.js";
import { staging } from "./staging.js";
import { createRateLimiter } from "../../src/common/middlewares/rate-limit.js";
import { loadEnv } from "../../src/config/env.js";
import { AppError } from "../../src/common/errors/app-error.js";
import { apiManifest } from "../../src/routes/api-manifest.js";
import { readSourceEndpoints } from "../../src/contracts/source-spec.js";
import { createRepository } from "../../src/common/persistence/repository.js";
import { runSeed } from "../../scripts/seed.js";

const execute = promisify(execFile);
const attach = (info, name, value) =>
  info.attach(name, { body: JSON.stringify(value, null, 2), contentType: "application/json" });
const scenarios = {
  async "NFR-0001"({ h }) {
    await h.call("searchContent", { query: { "q[$ne]": "x" }, status: 400 });
    await h.call("updateMyProfile", { body: { $set: { role: "admin" } }, status: 400 });
    await h.call("getRecipe", { params: { idOrSlug: '{"$gt":""}' }, status: 400 });
    expect(h.repositories.users.records.get(TEST_IDS.user).role).toBe("user");
  },
  async "NFR-0002"({ h }) {
    const before = h.snapshot();
    for (const op of ["updateMyProfile", "updatePost", "updateRecipe"])
      for (const body of [
        { role: "admin" },
        { userId: TEST_IDS.other },
        { createdAt: "2000-01-01" },
        { viewCount: 999 },
      ])
        await h.call(op, { body, status: 400 });
    for (const key of ["posts", "recipes"]) expect(h.snapshot()[key]).toEqual(before[key]);
    expect(h.repositories.users.records.get(TEST_IDS.user).role).toBe("user");
  },
  async "NFR-0003"({ h }) {
    for (const origin of ["http://localhost:8081", "https://evil.invalid"]) {
      const result = await h.http.fetch("/api/v1/users/me", {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "PATCH",
          "Access-Control-Request-Headers": "authorization,content-type",
        },
      });
      expect(result.headers()["access-control-allow-origin"]).toBe(
        origin.includes("evil") ? undefined : origin,
      );
      const unauthenticated = await h.http.get("/api/v1/users/me", { headers: { Origin: origin } });
      expect(unauthenticated.status()).toBe(origin.includes("evil") ? 403 : 401);
    }
  },
  async "NFR-0004"({ playwright }) {
    const limiters = Object.fromEntries(
      ["api", "auth", "upload", "ai"].map((name) => [
        `${name}RateLimiter`,
        createRateLimiter({ windowMs: 300, limit: name === "api" ? 20 : 2 }),
      ]),
    );
    const h = await openHarness(playwright, { overrides: limiters });
    try {
      for (const op of ["syncAuth", "createUploadRequest", "createAiConversation"]) {
        await h.call(op);
        await h.call(op);
        const blocked = await h.call(op, { status: 429 });
        expect(blocked.body.error.code).toBe("TOO_MANY_REQUESTS");
        expect(blocked.response.headers()["retry-after"]).toBeDefined();
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
      expect((await h.call("syncAuth")).status).toBe(200);
      for (let i = 0; i < 20; i++) await h.call("checkLiveness");
      await h.call("checkLiveness", { status: 429 });
    } finally {
      await h.close();
    }
  },
  async "NFR-0005"() {
    const script =
      'import {createLogger} from "./src/config/logger.js";const logger=createLogger({logLevel:"info",nodeEnv:"production"});logger.info({requestId:"qa-log",req:{headers:{authorization:"Bearer SECRET_BEARER"},body:{medicalNotes:"SECRET_MEDICAL"}},fcmTokens:["SECRET_FCM"],privateKey:"SECRET_KEY",token:"SECRET_TOKEN"},"request");';
    const { stdout } = await execute(process.execPath, ["--input-type=module", "-e", script]);
    for (const secret of [
      "SECRET_BEARER",
      "SECRET_MEDICAL",
      "SECRET_FCM",
      "SECRET_KEY",
      "SECRET_TOKEN",
    ])
      expect(stdout).not.toContain(secret);
    expect(stdout).toContain("qa-log");
    expect(stdout).toContain("[REDACTED]");
  },
  async "NFR-0006"({ h }) {
    for (const [repo, method, op] of [
      ["categories", "findMany", "getCategories"],
      ["mediaAssets", "findById", "getMediaAsset"],
    ]) {
      const original = h.repositories[repo][method];
      h.repositories[repo][method] = async () => {
        throw new Error("mongodb://SECRET_URI stack SECRET_PRIVATE_KEY");
      };
      const result = await h.call(op, { status: 500 });
      expect(result.body.error.code).toBe("INTERNAL_ERROR");
      expect(JSON.stringify(result.body)).not.toMatch(/SECRET|stack|mongodb:/);
      h.repositories[repo][method] = original;
    }
    h.authProvider.verifyIdToken = async () => {
      throw new Error("Firebase SECRET_KEY");
    };
    const result = await h.call("getMe");
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(result.body)).not.toContain("SECRET_KEY");
  },
  async "NFR-0007"({ playwright }) {
    const h = await openHarness(playwright, { envOverrides: { JSON_BODY_LIMIT: "1kb" } });
    try {
      await h.call("updateMyProfile", { body: { displayName: "x".repeat(2048) }, status: 413 });
    } finally {
      await h.close();
    }
  },
  async "NFR-0008"({ playwright }) {
    const s = await staging(playwright);
    try {
      expect(new URL(process.env.PW_STAGING_URL).protocol).toBe("https:");
      expect((await s.call("GET", "/health")).status).toBe(200);
      const { stdout } = await execute("git", [
        "ls-files",
        "--",
        ".env",
        "firebase-service-account*.json",
        "serviceAccount*.json",
      ]);
      expect(stdout.trim()).toBe("");
      const { stdout: tracked } = await execute("git", ["ls-files", "src", "scripts"]);
      for (const file of tracked.trim().split(/\r?\n/).filter(Boolean))
        expect(fs.readFileSync(file, "utf8")).not.toMatch(
          /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]{64,}/,
        );
    } finally {
      await s.close();
    }
  },
  async "NFR-0009"({ playwright }, info) {
    test.skip(
      !process.env.PW_P95_SLA_MS || !process.env.PW_P99_SLA_MS,
      "Blocked: agreed PW_P95_SLA_MS and PW_P99_SLA_MS are required by workbook",
    );
    const s = await staging(playwright, ["PW_RECIPE_ID"]);
    info.setTimeout(360000);
    const samples = [],
      statuses = [],
      end = Date.now() + 300000;
    try {
      await Promise.all(
        Array.from({ length: 20 }, async (_, worker) => {
          let i = worker;
          while (Date.now() < end) {
            const started = performance.now();
            const path = ["/home", "/search?q=tofu", `/recipes/${process.env.PW_RECIPE_ID}`][
              i++ % 3
            ];
            const result = await s.http.get(`${s.prefix}${path}`);
            samples.push(performance.now() - started);
            statuses.push(result.status());
            await result.dispose();
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }),
      );
      samples.sort((a, b) => a - b);
      const quantile = (q) => samples[Math.ceil(samples.length * q) - 1];
      const metrics = {
        requests: samples.length,
        p50: quantile(0.5),
        p95: quantile(0.95),
        p99: quantile(0.99),
        errors5xx: statuses.filter((s) => s >= 500).length,
      };
      await attach(info, "5-minute-20-user-latency", metrics);
      expect(metrics.errors5xx).toBe(0);
      expect(metrics.p95).toBeLessThanOrEqual(+process.env.PW_P95_SLA_MS);
      expect(metrics.p99).toBeLessThanOrEqual(+process.env.PW_P99_SLA_MS);
    } finally {
      await s.close();
    }
  },
  async "NFR-0010"({ h, playwright }, info) {
    const db = await database(h);
    info.setTimeout(120000);
    let app;
    try {
      await db.models.recipes.insertMany(
        Array.from({ length: 10000 }, (_, i) =>
          content({ title: `Tofu ${i}`, slug: `tofu-${i}`, servings: 1 }),
        ),
        { ordered: false },
      );
      const commands = [];
      db.connection.getClient().on("commandStarted", (event) => {
        if (["find", "aggregate", "count"].includes(event.commandName))
          commands.push(event.command);
      });
      app = await openHarness(playwright, {
        overrides: { repositories: { recipes: createRepository(db.models.recipes) } },
      });
      const started = performance.now();
      const response = await app.call("getRecipes", {
        query: { page: 1, limit: 100 },
        status: 200,
      });
      expect(response.data).toHaveLength(100);
      expect(response.body.meta.total).toBe(10000);
      expect(commands.length).toBeLessThanOrEqual(3);
      const explain = await db.models.recipes
        .find({ status: "published", visibility: "public", deletedAt: null })
        .sort({ publishedAt: -1, _id: -1 })
        .limit(100)
        .explain("executionStats");
      await attach(info, "large-list-query", {
        latencyMs: performance.now() - started,
        explain,
        commands,
      });
      expect(explain.executionStats.nReturned).toBe(100);
      expect(JSON.stringify(explain.queryPlanner.winningPlan)).toContain("IXSCAN");
    } finally {
      if (app) await app.close();
      await db.close();
    }
  },
  async "NFR-0011"({ playwright }, info) {
    const s = await staging(playwright, ["PW_USER_TOKEN", "PW_LARGE_UPLOAD"]);
    info.setTimeout(600000);
    expect(process.env.PW_LARGE_UPLOAD).toBe("true");
    try {
      const size = 524288000;
      const invalid = await s.call("POST", "/media/upload-requests", {
        body: {
          filename: "large.mp4",
          mimeType: "video/mp4",
          sizeBytes: size + 1,
          purpose: "video",
        },
      });
      expect(invalid.status).toBe(400);
      const valid = await s.call("POST", "/media/upload-requests", {
        body: { filename: "large.mp4", mimeType: "video/mp4", sizeBytes: size, purpose: "video" },
      });
      expect(valid.status).toBe(201);
      const started = performance.now();
      const uploaded = await s.http.put(valid.data.uploadUrl, {
        data: Buffer.alloc(size),
        headers: valid.data.requiredHeaders,
        timeout: 300000,
      });
      expect(uploaded.ok()).toBe(true);
      const confirmed = await s.call("POST", `/media/${valid.data.assetId}/confirm`);
      expect(confirmed.status).toBe(200);
      expect(confirmed.data.status).toBe("ready");
      await attach(info, "direct-R2-500MiB", {
        bytes: size,
        uploadMs: performance.now() - started,
        storageHost: new URL(valid.data.uploadUrl).hostname,
      });
      expect(new URL(valid.data.uploadUrl).origin).not.toBe(
        new URL(process.env.PW_STAGING_URL).origin,
      );
    } finally {
      await s.close();
    }
  },
  async "NFR-0012"({ h }, info) {
    test.skip(
      !globalThis.gc || !process.env.PW_HEAP_BUDGET_MB || !process.env.PW_RSS_BUDGET_MB,
      "Blocked: run Node with --expose-gc and set agreed PW_HEAP_BUDGET_MB / PW_RSS_BUDGET_MB",
    );
    info.setTimeout(120000);
    globalThis.gc();
    const before = process.memoryUsage();
    const samples = [];
    for (let i = 0; i < 1000; i++) {
      const response = await h.call(i % 10 === 0 ? "createUploadRequest" : "getHomeFeed");
      expect(response.status).toBeLessThan(300);
      await response.response.dispose();
      if (i % 100 === 99) {
        globalThis.gc();
        samples.push(process.memoryUsage());
      }
    }
    const after = samples.at(-1);
    await attach(info, "1000-request-memory", { before, after, samples });
    expect(after.heapUsed - before.heapUsed).toBeLessThanOrEqual(
      +process.env.PW_HEAP_BUDGET_MB * 1048576,
    );
    expect(after.rss - before.rss).toBeLessThanOrEqual(+process.env.PW_RSS_BUDGET_MB * 1048576);
  },
  async "NFR-0013"() {
    for (const source of [
      { AI_ENABLED: "true", AI_API_KEY: "CHANGE_ME" },
      { FCM_ENABLED: "true", FIREBASE_PRIVATE_KEY: "CHANGE_ME" },
      { NODE_ENV: "production", MONGODB_URI: "CHANGE_ME", APP_BASE_URL: "http://localhost" },
    ]) {
      expect(() => loadEnv(source)).toThrow();
      try {
        loadEnv(source);
      } catch (error) {
        expect(error.message).not.toContain("CHANGE_ME");
        expect(error.message).toMatch(/AI_|FIREBASE_|MONGODB_|APP_BASE_URL/);
      }
    }
  },
  async "NFR-0014"({ playwright }) {
    const h = await openHarness(playwright, {
      envOverrides: { AI_ENABLED: "false", AI_API_KEY: "" },
    });
    try {
      await h.call("checkLiveness", { status: 200 });
      await h.call("getCategories", { status: 200 });
      const result = await h.call("createMealPlanProposal", { status: 503 });
      expect(result.body.error.code).toBe("AI_DISABLED");
    } finally {
      await h.close();
    }
  },
  async "NFR-0015"({ playwright }) {
    const child = fork(new URL("./shutdown-child.js", import.meta.url), [], {
      stdio: ["ignore", "ignore", "pipe", "ipc"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    try {
      const first = await Promise.race([
        once(child, "message"),
        once(child, "exit").then(() => {
          throw new Error(stderr || "Child exited before startup");
        }),
      ]);
      const http = await playwright.request.newContext({
        baseURL: `http://127.0.0.1:${first[0].port}`,
      });
      try {
        expect((await http.get("/api/v1/health")).status()).toBe(200);
        const stopped = once(child, "message");
        const exited = once(child, "exit");
        // Windows has no POSIX SIGTERM delivery; IPC invokes the same exported shutdown path.
        if (process.platform === "win32") child.send("SIGTERM");
        else child.kill("SIGTERM");
        if (process.platform === "win32")
          expect((await stopped)[0]).toMatchObject({
            stopped: true,
            listening: false,
            schedulerStopped: true,
          });
        expect((await exited)[0]).toBe(0);
        await expect(http.get("/api/v1/health", { timeout: 1000 })).rejects.toThrow();
      } finally {
        await http.dispose();
      }
    } finally {
      if (child.exitCode === null) child.kill();
    }
  },
  async "NFR-0016"({ playwright }) {
    let status = "disconnected";
    const h = await openHarness(playwright, { overrides: { getDatabaseStatus: () => status } });
    try {
      await h.call("checkReadiness", { status: 503 });
      const find = h.repositories.categories.findMany;
      h.repositories.categories.findMany = async () => {
        throw AppError.serviceUnavailable("Database unavailable", "DATABASE_UNAVAILABLE");
      };
      await h.call("getCategories", { status: 503 });
      status = "connected";
      h.repositories.categories.findMany = find;
      await h.call("checkReadiness", { status: 200 });
      await h.call("getCategories", { status: 200 });
    } finally {
      await h.close();
    }
  },
  async "NFR-0017"({ h }) {
    const db = await database(h);
    try {
      const original = await db.models.users.create({
        firebaseUid: "qa-preserved-user",
        email: "qa@vegan.test",
        role: "user",
        status: "active",
      });
      const container = {
        models: db.models,
        env: { seed: { adminFirebaseUid: "qa-existing-admin", adminEmail: "qa-admin@vegan.test" } },
        logger: { info() {} },
      };
      await runSeed(container);
      const before = Object.fromEntries(
        await Promise.all(
          Object.entries(db.models).map(async ([key, model]) => [
            key,
            (await model.find().select("_id").lean()).map((row) => String(row._id)).sort(),
          ]),
        ),
      );
      await runSeed(container);
      for (const [key, model] of Object.entries(db.models))
        expect(
          (await model.find().select("_id").lean()).map((row) => String(row._id)).sort(),
        ).toEqual(before[key]);
      expect(await db.models.users.findById(original._id).lean()).not.toBeNull();
    } finally {
      await db.close();
    }
  },
  async "NFR-0018"({ h }, info) {
    test.skip(
      !process.env.PW_MONGODUMP || !process.env.PW_MONGORESTORE,
      "Blocked: paths to mongodump and mongorestore are required",
    );
    const db = await database(h);
    info.setTimeout(120000);
    const archive = info.outputPath("qa-backup.archive");
    const restoreName = `${db.dbName}_restore`;
    try {
      const user = await db.models.users.create({
        firebaseUid: "qa-backup-owner",
        email: "backup@vegan.test",
      });
      await db.models.recipes.create({
        title: "Backup recipe",
        slug: "backup-recipe",
        authorId: user._id,
        servings: 1,
      });
      await db.models.diaryEntries.create({
        userId: user._id,
        date: "2026-10-05",
        mealType: "lunch",
        sourceType: "custom",
        nameSnapshot: "QA",
        servings: 1,
        nutritionSnapshot: { caloriesKcal: 100 },
        nutritionBasis: { caloriesKcal: 100 },
        basisQuantity: 1,
        basisUnit: "serving",
      });
      const before = {};
      for (const key of ["users", "recipes", "diaryEntries"])
        before[key] = {
          rows: await db.models[key].find().lean(),
          indexes: await db.models[key].collection.indexes(),
        };
      const uri = new URL(db.config.uri);
      uri.pathname = `/${db.dbName}`;
      await execute(process.env.PW_MONGODUMP, ["--uri", uri.toString(), "--archive=" + archive], {
        timeout: 60000,
      });
      await execute(
        process.env.PW_MONGORESTORE,
        [
          "--uri",
          uri.toString(),
          "--archive=" + archive,
          "--nsFrom",
          `${db.dbName}.*`,
          "--nsTo",
          `${restoreName}.*`,
        ],
        { timeout: 60000 },
      );
      const restored = db.connection.getClient().db(restoreName);
      for (const key of Object.keys(before)) {
        const collection = restored.collection(db.models[key].collection.name);
        expect(await collection.find().toArray()).toEqual(before[key].rows);
        expect(await collection.indexes()).toEqual(before[key].indexes);
      }
      await attach(
        info,
        "backup-restore-counts",
        Object.fromEntries(Object.entries(before).map(([key, data]) => [key, data.rows.length])),
      );
    } finally {
      if (restoreName.startsWith("test_vegan_") && restoreName === `${db.dbName}_restore`)
        await db.connection.getClient().db(restoreName).dropDatabase();
      fs.rmSync(archive, { force: true });
      await db.close();
    }
  },
  async "NFR-0019"({ h }) {
    const normalize = (r) => `${r.method.toUpperCase()} ${r.path.replace(/\{(\w+)\}/g, ":$1")}`;
    const source = readSourceEndpoints();
    expect(source).toHaveLength(184);
    const manifest = apiManifest.map(normalize).sort();
    const openapi = Object.entries(document.paths)
      .flatMap(([path, methods]) =>
        Object.keys(methods).map((method) => normalize({ method, path })),
      )
      .sort();
    const mounted = h.app.router.stack
      .flatMap((layer) => layer.handle?.registeredOperations ?? [])
      .map(normalize)
      .sort();
    expect(manifest).toEqual(source.map(normalize).sort());
    expect(openapi).toEqual(manifest);
    expect(mounted).toEqual(manifest);
    expect(new Set(apiManifest.map((r) => r.operationId)).size).toBe(184);
  },
  async "NFR-0020"({ h }) {
    for (const op of [
      "checkLiveness",
      "getCategories",
      "getMealPlans",
      "getRecipes",
      "getPosts",
      "getVideos",
      "getNotifications",
      "getAiConversations",
      "getMyNutritionProfile",
      "getWeightLogs",
      "getWaterLogs",
      "getAdminUsers",
      "getAiMetrics",
    ]) {
      const response = await h.call(op, { status: 200 });
      expect(response.body).toMatchObject({
        success: true,
        meta: { requestId: expect.any(String) },
      });
      expect(response.body).toHaveProperty("data");
    }
    const denied = await h.call("getMe", { token: null, status: 401 });
    expect(denied.body).toMatchObject({
      success: false,
      error: { code: expect.any(String), message: expect.any(String) },
      meta: { requestId: expect.any(String) },
    });
  },
  async "NFR-0021"({ h }) {
    for (const query of [{ page: 0 }, { limit: 101 }, { sort: "$where" }])
      await h.call("getRecipes", { query, status: 400 });
    await h.call("getDiarySummary", {
      query: { from: "2026-10-06", to: "2026-10-05" },
      status: 400,
    });
    await h.call("getAuditLogs", { query: { from: "2026-10-06", to: "2026-10-05" }, status: 400 });
  },
  async "NFR-0022"({ h, playwright }) {
    const db = await database(h);
    let app;
    try {
      const owner = await db.models.users.create({
        firebaseUid: "qa-unique-owner",
        email: "unique@vegan.test",
      });
      const fixtures = {
        users: { firebaseUid: "qa-same-uid", email: "same@vegan.test" },
        userProfiles: { userId: owner._id },
        reactions: { userId: owner._id, targetType: "recipe", targetId: ID.recipe, type: "like" },
        ratings: { userId: owner._id, targetType: "recipe", targetId: ID.recipe, score: 5 },
        savedItems: { userId: owner._id, targetType: "recipe", targetId: ID.recipe },
      };
      for (const [key, data] of Object.entries(fixtures)) {
        const results = await Promise.allSettled(
          Array.from({ length: 10 }, () => db.models[key].create(data)),
        );
        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        for (const result of results.filter((r) => r.status === "rejected"))
          expect(result.reason.code).toBe(11000);
      }
      await db.models.users.create({
        _id: TEST_IDS.user,
        firebaseUid: "uid-user",
        email: "user@example.com",
        role: "user",
        status: "active",
      });
      await db.models.recipes.create(content({ _id: ID.recipe, slug: "http-unique", servings: 1 }));
      const repositories = Object.fromEntries(
        Object.entries(db.models).map(([key, model]) => [key, createRepository(model)]),
      );
      const transaction = async (work) => {
        const session = await db.connection.startSession();
        let result;
        try {
          await session.withTransaction(async () => {
            result = await work(session);
          });
          return result;
        } finally {
          await session.endSession();
        }
      };
      app = await openHarness(playwright, { overrides: { repositories, transaction } });
      for (const [op, input, key, filter] of [
        ["syncAuth", { token: TEST_TOKENS.newcomer }, "users", { firebaseUid: "uid-new" }],
        [
          "upsertMyProfile",
          { body: { bio: "Concurrency" } },
          "userProfiles",
          { userId: TEST_IDS.user },
        ],
        [
          "upsertReaction",
          {},
          "reactions",
          { userId: TEST_IDS.user, targetType: "recipe", targetId: ID.recipe },
        ],
        [
          "upsertRating",
          { body: { score: 5 } },
          "ratings",
          { userId: TEST_IDS.user, targetType: "recipe", targetId: ID.recipe },
        ],
        [
          "saveItem",
          {},
          "savedItems",
          { userId: TEST_IDS.user, targetType: "recipe", targetId: ID.recipe },
        ],
      ]) {
        const results = await Promise.all(Array.from({ length: 10 }, () => app.call(op, input)));
        expect(results.every((r) => [200, 409].includes(r.status))).toBe(true);
        expect(results.some((r) => r.status === 200)).toBe(true);
        expect(await db.models[key].countDocuments(filter)).toBe(1);
        for (const result of results)
          expect(JSON.stringify(result.body)).not.toMatch(/E11000|MongoServerError/);
      }
    } finally {
      if (app) await app.close();
      await db.close();
    }
  },
  async "NFR-0023"({ h }) {
    const when = "2026-10-06T00:30:00+07:00";
    const water = await h.call("createWaterLog", {
      body: { amountMl: 250, recordedAt: when },
      status: 201,
    });
    expect(water.data.recordedAt).toBe("2026-10-05T17:30:00.000Z");
    const reminder = await h.call("createReminder", {
      body: {
        type: "water",
        title: "Water",
        body: "Drink",
        schedule: { mode: "once", at: when, timezone: "Asia/Ho_Chi_Minh" },
      },
      status: 201,
    });
    expect(reminder.data.nextRunAt).toBe("2026-10-05T17:30:00.000Z");
  },
  async "NFR-0024"({ h }) {
    const before = h.snapshot();
    h.repositories.auditLogs.create = async () => {
      throw new Error("Injected audit write failure");
    };
    await h.call("updateFoodItem", { body: { name: "Must roll back" }, status: 500 });
    for (const key of ["foodItems", "auditLogs"]) expect(h.snapshot()[key]).toEqual(before[key]);
    const update = h.repositories.recipes.updateOne;
    h.repositories.recipes.updateOne = async () => {
      throw new Error("Injected aggregate write failure");
    };
    await h.call("upsertReaction", { status: 500 });
    expect(h.snapshot().reactions).toEqual(before.reactions);
    expect(h.snapshot().recipes).toEqual(before.recipes);
    h.repositories.recipes.updateOne = update;
  },
};

for (const c of cases.filter((c) => c.id.startsWith("NFR-"))) {
  if (!scenarios[c.id]) throw new Error(`Missing NFR scenario ${c.id}`);
  test(
    `${c.id} | ${c.feature}`,
    {
      tag: ["@nfr", `@${c.priority}`],
      annotation: { type: "Excel", description: `${c.sheet}!A${c.row}: ${c.expected}` },
    },
    scenarios[c.id],
  );
}
