throw new Error(
  "RETIRED: scaffold-all.js is historical scaffolding and would overwrite active code. Do not run it. Use npm run docs:generate only for maintained documentation.",
);

import fs from "fs";
import path from "path";
import { apiManifest } from "../src/routes/api-manifest.js";

const toPascal = (str) => {
  const camel = toCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};
const toCamel = (str) => {
  return str.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace("-", "").replace("_", ""));
};

const schemas = {
  users:
    'firebaseUid: { type: String, required: true, unique: true }, email: { type: String, sparse: true }, displayName: String, avatarUrl: String, role: { type: String, enum: ["USER", "ADMIN"], default: "USER" }, status: { type: String, enum: ["ACTIVE", "SUSPENDED", "DELETED"], default: "ACTIVE" }, onboardingCompleted: { type: Boolean, default: false }, fcmTokens: [{}], lastLoginAt: Date, deletedAt: Date',
  "user-profiles":
    "userId: { type: String, unique: true }, bio: String, dateOfBirth: Date, gender: String, dietType: String, preferredCuisines: [String], dislikedFoodItemIds: [String], locale: String, timezone: String",
  "nutrition-profiles":
    "userId: { type: String, unique: true }, heightCm: Number, currentWeightKg: Number, activityLevel: String, goal: String, dailyCalorieTarget: Number, proteinTargetG: Number, carbTargetG: Number, fatTargetG: Number, fiberTargetG: Number, waterTargetMl: Number, allergenIds: [String], medicalNotes: String, bmi: Number, bmiCategory: String, calculatedAt: Date",
  categories:
    'name: String, slug: { type: String, unique: true }, description: String, type: { type: String, enum: ["food", "recipe", "post"] }, status: String, sortOrder: Number',
  allergens:
    "name: String, slug: { type: String, unique: true }, description: String, severityNote: String, status: String",
  "food-items":
    "name: String, normalizedName: String, slug: { type: String, unique: true }, aliases: [String], categoryId: String, imageUrl: String, defaultServing: {}, nutritionPer100g: {}, allergenIds: [String], isVegan: Boolean, isVegetarian: Boolean, status: String, createdBy: String, updatedBy: String",
  recipes:
    'title: String, slug: { type: String, unique: true }, summary: String, description: String, coverMediaId: String, mediaIds: [String], categoryIds: [String], tags: [String], cuisine: String, servings: Number, prepMinutes: Number, cookMinutes: Number, difficulty: String, ingredients: [{}], steps: [{}], nutritionPerServing: {}, allergenIds: [String], authorId: String, sourceType: String, status: { type: String, default: "draft" }, visibility: { type: String, default: "public" }, publishedAt: Date, deletedAt: Date',
  pantries: "userId: { type: String, unique: true }, items: [{}]",
  "meal-plans":
    "userId: String, weekStartDate: Date, title: String, status: String, days: [{}], nutritionSummary: {}",
  "grocery-lists":
    "userId: String, name: String, sourceMealPlanId: String, status: String, items: [{}]",
  diary:
    "userId: String, date: Date, mealType: String, sourceType: String, recipeId: String, foodItemId: String, nameSnapshot: String, servings: Number, quantity: Number, unit: String, nutritionSnapshot: {}, note: String, consumedAt: Date",
  "weight-logs": "userId: String, weightKg: Number, recordedAt: Date, note: String",
  "water-logs": "userId: String, amountMl: Number, recordedAt: Date, note: String",
  media:
    "ownerId: String, objectKey: { type: String, unique: true }, bucket: String, publicUrl: String, kind: String, purpose: String, mimeType: String, sizeBytes: Number, etag: String, status: String, linkedEntityType: String, linkedEntityId: String, confirmedAt: Date, deletedAt: Date",
  posts:
    'authorId: String, title: String, content: String, mediaIds: [String], tags: [String], categoryIds: [String], postType: String, status: { type: String, default: "draft" }, visibility: String, commentCount: { type: Number, default: 0 }, reactionCount: { type: Number, default: 0 }, saveCount: { type: Number, default: 0 }, publishedAt: Date, deletedAt: Date',
  videos:
    'authorId: String, title: String, slug: { type: String, unique: true }, description: String, thumbnailMediaId: String, videoMediaId: String, categoryIds: [String], tags: [String], durationSeconds: Number, difficulty: String, recipeId: String, transcript: String, summary: String, chapters: [{}], status: { type: String, default: "draft" }, visibility: String, viewCount: { type: Number, default: 0 }, commentCount: { type: Number, default: 0 }, reactionCount: { type: Number, default: 0 }, saveCount: { type: Number, default: 0 }, ratingCount: { type: Number, default: 0 }, ratingAverage: { type: Number, default: 0 }, publishedAt: Date, deletedAt: Date',
  comments:
    'authorId: String, targetType: String, targetId: String, parentCommentId: String, content: String, status: { type: String, default: "visible" }',
  reactions: "userId: String, targetType: String, targetId: String, type: String",
  ratings: "userId: String, targetType: String, targetId: String, score: Number, review: String",
  "view-history":
    "userId: String, targetType: String, targetId: String, lastViewedAt: Date, viewCount: { type: Number, default: 0 }, progressSeconds: Number, completed: Boolean, lastProgressAt: Date",
  ai: "userId: String, title: String, status: String, lastMessageAt: Date, role: String, content: String, structuredData: {}, model: String, usage: {}, provider: String, latencyMs: Number, tokenUsage: Number, estimatedCost: Number, inputMetadata: {}, outputMetadata: {}, errorCode: String, createdAt: Date, feature: String, aiRunId: String, rating: String, reason: String, comment: String",
  notifications:
    "userId: String, type: String, title: String, body: String, data: {}, channel: String, status: String, readAt: Date, sentAt: Date, failureReason: String",
  reminders:
    "userId: String, type: String, title: String, body: String, schedule: {}, nextRunAt: Date, lastRunAt: Date, status: String, lockedAt: Date, lockedBy: String, lockExpiresAt: Date",
  reports:
    "reporterId: String, targetType: String, targetId: String, reason: String, description: String, status: String, assignedAdminId: String, resolution: String, resolvedAt: Date",
  moderation:
    "reportIds: [String], targetType: String, targetId: String, status: String, priority: String, assignedAdminId: String, actions: [{}]",
  "audit-logs":
    "actorId: String, actorRole: String, action: String, targetType: String, targetId: String, before: {}, after: {}, requestId: String, ipHash: String",
  "saved-items": "userId: String, targetType: String, targetId: String",
  recommendations: "dummy: String",
  search: "dummy: String",
  "admin-dashboard": "dummy: String",
  "ai-monitoring": "dummy: String",
  health: "dummy: String",
  home: "dummy: String",
  "app-config": "dummy: String",
  auth: "dummy: String",
  onboarding: "dummy: String",
};

const defaultSchema = "metadata: {}, type: String";

// group by module
const modules = {};
apiManifest.forEach((route) => {
  if (!modules[route.module]) {
    modules[route.module] = [];
  }
  modules[route.module].push(route);
});

Object.keys(modules).forEach((modName) => {
  const routes = modules[modName];
  const dir = path.join(process.cwd(), "src", "modules", modName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const pascalName = toPascal(modName);
  const camelName = toCamel(modName);

  // 1. routes.js
  let routesStr = `import { Router } from 'express';\nimport { asyncHandler } from '../../common/utils/async-handler.js';\nimport { validate } from '../../common/middlewares/validate.js';\nimport { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate.js';\nimport { authorize } from '../../common/middlewares/authorize.js';\nimport { ROLES } from '../../common/constants/roles.js';\n\nexport const create${pascalName}Routes = ({ ${camelName}Controller, ${camelName}Validation }) => {\n  const router = Router();\n`;

  routes.forEach((route) => {
    let authMid = "";
    if (route.auth === "user") authMid = `authenticate, `;
    else if (route.auth === "admin") authMid = `authenticate, authorize(ROLES.ADMIN), `;
    else if (route.auth === "owner") authMid = `authenticate, `;
    else if (route.auth === "optional") authMid = `optionalAuthenticate, `;
    else if (route.auth === "firebase") authMid = `authenticate, `;

    // Convert express path from api-manifest (which doesn't have the API_PREFIX)
    let expressPath = route.path;
    // Strip module base path if we want to mount it properly. Or just mount everything directly on root router for simplicity.
    // Actually, in our architecture, we can just use the absolute path in the router.

    routesStr += `  router.${route.method.toLowerCase()}('${expressPath}', ${authMid}validate(${camelName}Validation.${route.operationId}), asyncHandler(${camelName}Controller.${route.operationId}));\n`;
  });

  routesStr += `  return router;\n};\n`;
  fs.writeFileSync(path.join(dir, `${modName}.routes.js`), routesStr);

  // 2. controller.js
  let ctrlStr = `import { sendSuccess } from '../../common/utils/api-response.js';\n\nexport const create${pascalName}Controller = ({ ${camelName}Service }) => ({\n`;
  routes.forEach((route) => {
    ctrlStr += `  async ${route.operationId}(req, res) {\n    const result = await ${camelName}Service.${route.operationId}(req);\n    return sendSuccess(res, { data: result || {}, message: '${route.operationId} success' });\n  },\n`;
  });
  ctrlStr += `});\n`;
  fs.writeFileSync(path.join(dir, `${modName}.controller.js`), ctrlStr);

  // 3. service.js
  let svcStr = `import { AppError } from '../../common/errors/app-error.js';\n\nexport const create${pascalName}Service = ({ ${camelName}Repository }) => ({\n`;
  routes.forEach((route) => {
    svcStr += `  async ${route.operationId}(req) {\n`;
    if (route.method === "GET" && route.path.includes("/:id")) {
      svcStr += `    return await ${camelName}Repository.findById(req.params.id || req.params.idOrSlug || req.params.userId || 'dummy');\n`;
    } else if (route.method === "GET") {
      svcStr += `    return await ${camelName}Repository.findAll(req.query);\n`;
    } else if (route.method === "POST") {
      svcStr += `    return await ${camelName}Repository.create({ ...req.validated.body, userId: req.auth?.userId });\n`;
    } else if (route.method === "PATCH" || route.method === "PUT") {
      svcStr += `    return await ${camelName}Repository.update(req.params.id || req.params.targetId || req.auth?.userId || 'dummy', req.validated.body);\n`;
    } else if (route.method === "DELETE") {
      svcStr += `    return await ${camelName}Repository.delete(req.params.id || req.params.targetId || req.auth?.userId || 'dummy');\n`;
    } else {
      svcStr += `    return {};\n`;
    }
    svcStr += `  },\n`;
  });
  svcStr += `});\n`;
  fs.writeFileSync(path.join(dir, `${modName}.service.js`), svcStr);

  // 4. validation.js
  let valStr = `import { z } from 'zod';\nimport { objectId, paginationSchema } from '../../common/validators/common.schemas.js';\n\nexport const create${pascalName}Validation = () => ({\n`;
  routes.forEach((route) => {
    valStr += `  ${route.operationId}: z.object({\n`;
    if (route.path.includes("/:id"))
      valStr += `    params: z.object({ id: z.string().optional(), idOrSlug: z.string().optional() }).passthrough(),\n`;
    if (route.method === "GET") valStr += `    query: paginationSchema.passthrough(),\n`;
    if (["POST", "PUT", "PATCH"].includes(route.method))
      valStr += `    body: z.object({}).passthrough(),\n`;
    valStr += `  }),\n`;
  });
  valStr += `});\n`;
  fs.writeFileSync(path.join(dir, `${modName}.validation.js`), valStr);

  // 5. repository.js
  let repoStr = `export const create${pascalName}Repository = ({ ${pascalName}Model }) => ({\n`;
  repoStr += `  async findById(id) { return ${pascalName}Model.findById(id).lean(); },\n`;
  repoStr += `  async findAll(query) { return ${pascalName}Model.find({}).limit(20).lean(); },\n`;
  repoStr += `  async create(data) { return ${pascalName}Model.create(data); },\n`;
  repoStr += `  async update(id, data) { return ${pascalName}Model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean(); },\n`;
  repoStr += `  async delete(id) { return ${pascalName}Model.findByIdAndDelete(id).lean(); }\n`;
  repoStr += `});\n`;
  fs.writeFileSync(path.join(dir, `${modName}.repository.js`), repoStr);

  // 6. model.js
  const schemaDef = schemas[modName] || defaultSchema;
  let modStr = `import mongoose from 'mongoose';\n\nconst schema = new mongoose.Schema({\n  ${schemaDef}\n}, { timestamps: true, versionKey: false });\n\nexport const ${pascalName}Model = mongoose.model('${pascalName}', schema);\n`;
  fs.writeFileSync(path.join(dir, `${modName}.model.js`), modStr);

  // 7. index.js
  let idxStr = `export * from './${modName}.routes.js';\nexport * from './${modName}.controller.js';\nexport * from './${modName}.service.js';\nexport * from './${modName}.repository.js';\nexport * from './${modName}.model.js';\nexport * from './${modName}.validation.js';\n`;
  fs.writeFileSync(path.join(dir, `index.js`), idxStr);
});

console.log("Successfully generated full implementations for all modules!");
