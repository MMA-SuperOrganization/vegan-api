throw new Error(
  "RETIRED: generate-phase5-9.js is historical scaffolding and would overwrite active code. Do not run it.",
);

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const root = join(process.cwd(), "src", "modules");

const modules = {
  pantries: {
    model: `import mongoose from "mongoose";
const pantryItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem" },
  customName: String,
  quantity: { amount: Number, unit: String },
  expirationDate: Date,
}, { timestamps: true, versionKey: false });
export const PantryItem = mongoose.models.PantryItem ?? mongoose.model("PantryItem", pantryItemSchema);`,
    repo: `import { PantryItem } from "./pantry.model.js";
export const createPantryRepository = () => ({
  async findMany(filter) { return PantryItem.find(filter).lean(); },
  async create(data) { return (await new PantryItem(data).save()).toObject(); },
  async deleteById(id) { return PantryItem.findByIdAndDelete(id).lean(); },
  async updateById(id, data) { return PantryItem.findByIdAndUpdate(id, data, {new: true}).lean(); }
});`,
    val: `import { z } from "zod"; export const pantrySchema = z.any();`,
    svc: `export const createPantryService = ({ pantryRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createPantryController = ({ pantryService }) => ({
  async getAll(req, res) { return sendSuccess(res, { data: [] }); }
});`,
    routes: `import { Router } from "express";
export const createPantryRoutes = (container) => {
  const router = Router();
  router.get("/", container.authenticate, (req, res) => res.json([]));
  return router;
};`,
  },
  "meal-plans": {
    model: `import mongoose from "mongoose";
const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  startDate: Date,
  endDate: Date,
  status: String,
}, { timestamps: true, versionKey: false });
export const MealPlan = mongoose.models.MealPlan ?? mongoose.model("MealPlan", mealPlanSchema);`,
    repo: `import { MealPlan } from "./meal-plan.model.js";
export const createMealPlanRepository = () => ({});`,
    val: `import { z } from "zod"; export const mealPlanSchema = z.any();`,
    svc: `export const createMealPlanService = ({ mealPlanRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createMealPlanController = ({ mealPlanService }) => ({});`,
    routes: `import { Router } from "express";
export const createMealPlanRoutes = (container) => Router();`,
  },
  "grocery-lists": {
    model: `import mongoose from "mongoose";
const groceryListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  items: [{}],
}, { timestamps: true, versionKey: false });
export const GroceryList = mongoose.models.GroceryList ?? mongoose.model("GroceryList", groceryListSchema);`,
    repo: `import { GroceryList } from "./grocery-list.model.js";
export const createGroceryListRepository = () => ({});`,
    val: `import { z } from "zod"; export const groceryListSchema = z.any();`,
    svc: `export const createGroceryListService = ({ groceryListRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createGroceryListController = ({ groceryListService }) => ({});`,
    routes: `import { Router } from "express";
export const createGroceryListRoutes = (container) => Router();`,
  },
  diary: {
    model: `import mongoose from "mongoose";
const diarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: Date,
}, { timestamps: true, versionKey: false });
export const Diary = mongoose.models.Diary ?? mongoose.model("Diary", diarySchema);`,
    repo: `import { Diary } from "./diary.model.js";
export const createDiaryRepository = () => ({});`,
    val: `import { z } from "zod"; export const diarySchema = z.any();`,
    svc: `export const createDiaryService = ({ diaryRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createDiaryController = ({ diaryService }) => ({});`,
    routes: `import { Router } from "express";
export const createDiaryRoutes = (container) => Router();`,
  },
  "weight-logs": {
    model: `import mongoose from "mongoose";
const weightLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  weightKg: Number,
}, { timestamps: true, versionKey: false });
export const WeightLog = mongoose.models.WeightLog ?? mongoose.model("WeightLog", weightLogSchema);`,
    repo: `import { WeightLog } from "./weight-log.model.js";
export const createWeightLogRepository = () => ({});`,
    val: `import { z } from "zod"; export const weightLogSchema = z.any();`,
    svc: `export const createWeightLogService = ({ weightLogRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createWeightLogController = ({ weightLogService }) => ({});`,
    routes: `import { Router } from "express";
export const createWeightLogRoutes = (container) => Router();`,
  },
  "water-logs": {
    model: `import mongoose from "mongoose";
const waterLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amountMl: Number,
}, { timestamps: true, versionKey: false });
export const WaterLog = mongoose.models.WaterLog ?? mongoose.model("WaterLog", waterLogSchema);`,
    repo: `import { WaterLog } from "./water-log.model.js";
export const createWaterLogRepository = () => ({});`,
    val: `import { z } from "zod"; export const waterLogSchema = z.any();`,
    svc: `export const createWaterLogService = ({ waterLogRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createWaterLogController = ({ waterLogService }) => ({});`,
    routes: `import { Router } from "express";
export const createWaterLogRoutes = (container) => Router();`,
  },
  ai: {
    model: `import mongoose from "mongoose";
const aiSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });
export const AiRun = mongoose.models.AiRun ?? mongoose.model("AiRun", aiSchema);`,
    repo: `import { AiRun } from "./ai.model.js";
export const createAiRepository = () => ({});`,
    val: `import { z } from "zod"; export const aiSchema = z.any();`,
    svc: `export const createAiService = ({ aiRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createAiController = ({ aiService }) => ({});`,
    routes: `import { Router } from "express";
export const createAiRoutes = (container) => Router();`,
  },
  notifications: {
    model: `import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });
export const Notification = mongoose.models.Notification ?? mongoose.model("Notification", notificationSchema);`,
    repo: `import { Notification } from "./notification.model.js";
export const createNotificationRepository = () => ({});`,
    val: `import { z } from "zod"; export const notificationSchema = z.any();`,
    svc: `export const createNotificationService = ({ notificationRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createNotificationController = ({ notificationService }) => ({});`,
    routes: `import { Router } from "express";
export const createNotificationRoutes = (container) => Router();`,
  },
  reminders: {
    model: `import mongoose from "mongoose";
const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true, versionKey: false });
export const Reminder = mongoose.models.Reminder ?? mongoose.model("Reminder", reminderSchema);`,
    repo: `import { Reminder } from "./reminder.model.js";
export const createReminderRepository = () => ({});`,
    val: `import { z } from "zod"; export const reminderSchema = z.any();`,
    svc: `export const createReminderService = ({ reminderRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createReminderController = ({ reminderService }) => ({});`,
    routes: `import { Router } from "express";
export const createReminderRoutes = (container) => Router();`,
  },
  "admin-dashboard": {
    model: `export {};`,
    repo: `export const createAdminDashboardRepository = () => ({});`,
    val: `import { z } from "zod"; export const adminDashboardSchema = z.any();`,
    svc: `export const createAdminDashboardService = ({ adminDashboardRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createAdminDashboardController = ({ adminDashboardService }) => ({});`,
    routes: `import { Router } from "express";
export const createAdminDashboardRoutes = (container) => Router();`,
  },
  "ai-monitoring": {
    model: `export {};`,
    repo: `export const createAiMonitoringRepository = () => ({});`,
    val: `import { z } from "zod"; export const aiMonitoringSchema = z.any();`,
    svc: `export const createAiMonitoringService = ({ aiMonitoringRepository }) => ({});`,
    ctrl: `import { sendSuccess } from "../../common/utils/api-response.js";
export const createAiMonitoringController = ({ aiMonitoringService }) => ({});`,
    routes: `import { Router } from "express";
export const createAiMonitoringRoutes = (container) => Router();`,
  },
};

for (const [mod, files] of Object.entries(modules)) {
  const dir = join(root, mod);
  mkdirSync(dir, { recursive: true });

  // Clean names e.g. meal-plans -> meal-plan
  const baseName =
    mod.endsWith("s") && mod !== "pantries"
      ? mod.slice(0, -1)
      : mod === "pantries"
        ? "pantry"
        : mod;

  if (files.model) writeFileSync(join(dir, baseName + ".model.js"), files.model);
  writeFileSync(join(dir, baseName + ".repository.js"), files.repo);
  writeFileSync(join(dir, baseName + ".validation.js"), files.val);
  writeFileSync(join(dir, baseName + ".service.js"), files.svc);
  writeFileSync(join(dir, baseName + ".controller.js"), files.ctrl);
  writeFileSync(join(dir, baseName + ".routes.js"), files.routes);
}

console.log("Done generating stub files for Phase 5-9");
