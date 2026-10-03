import { z } from "zod";
import { AppError } from "../../common/errors/app-error.js";
import {
  id,
  text,
  pagination,
  idParams,
  user,
  admin,
  found,
  service,
  targetTypes,
  rangeSchema,
  range,
  atomic,
  audit,
  now,
} from "../app-config/index.js";
export const reportStatuses = ["open", "reviewing", "resolved", "dismissed"];
const listQuery = rangeSchema({
  ...pagination,
  status: z.enum(reportStatuses).optional(),
  targetType: z.enum(targetTypes).optional(),
  assignedAdminId: id.optional(),
});
export const reportsValidation = {
  createReport: {
    body: z
      .object({
        targetType: z.enum(targetTypes),
        targetId: id,
        reason: z.enum(["spam", "harmful", "misinformation", "harassment", "copyright", "other"]),
        description: text(2000).optional(),
      })
      .strict(),
  },
  getMyReports: { query: listQuery },
  getMyReport: { params: idParams },
  getAdminReports: { query: listQuery },
  updateAdminReport: {
    params: idParams,
    body: z
      .object({
        status: z.enum(reportStatuses).optional(),
        assignedAdminId: id.nullable().optional(),
        resolution: text(2000).optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
  },
};
export const validateAssignee = async (deps, assignedAdminId) => {
  if (!assignedAdminId) return;
  const account = found(
    await service(deps, "users", "getById")(assignedAdminId, { allowInactive: true }),
    "Assigned admin not found",
  );
  if (account.role !== "admin" || account.status !== "active")
    throw AppError.badRequest("Assignee must be an active admin");
};
export const validateTransition = (before, status, resolution) => {
  if (["resolved", "dismissed"].includes(before.status) && status && status !== before.status)
    throw AppError.conflict("Closed reports cannot be reopened");
  if (["resolved", "dismissed"].includes(status) && !(resolution ?? before.resolution)?.trim())
    throw AppError.badRequest("A resolution is required to close a report");
};
export const createReportsService = (deps, repository) => ({
  async createReport({ actor, body }) {
    const reporterId = user(actor);
    if (body.targetType === "user") {
      const target = found(
        await service(deps, "users", "getById")(body.targetId, { allowInactive: true }),
        "Report target not found",
      );
      if (target.deletedAt || target.status === "deleted")
        throw AppError.notFound("Report target not found");
    } else
      await service(deps, "content", "getTarget")(body.targetType, body.targetId, {
        actor,
        publicOnly: true,
      });
    const existing = await repository.findOne({
      reporterId,
      targetType: body.targetType,
      targetId: body.targetId,
      status: { $in: ["open", "reviewing"] },
    });
    if (existing) throw AppError.conflict("You already have an open report for this target");
    return repository.create({ reporterId, ...body, status: "open", version: 0 });
  },
  async getMyReports({ actor, query = {} }) {
    const filter = { reporterId: user(actor), createdAt: range(deps, query).filter };
    for (const key of ["status", "targetType"]) if (query[key]) filter[key] = query[key];
    return repository.findMany(filter, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sort: { createdAt: -1, _id: -1 },
    });
  },
  async getMyReport({ actor, params }) {
    return found(await repository.findOne({ _id: params.id, reporterId: user(actor) }));
  },
  async getAdminReports({ actor, query = {} }) {
    admin(actor);
    const filter = { createdAt: range(deps, query).filter };
    for (const key of ["status", "targetType", "assignedAdminId"])
      if (query[key]) filter[key] = query[key];
    return repository.findMany(filter, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sort: { createdAt: -1, _id: -1 },
    });
  },
  async updateAdminReport(context) {
    const { actor, body, params } = context;
    admin(actor);
    await validateAssignee(deps, body.assignedAdminId);
    return atomic(deps, async (session) => {
      const before = found(await repository.findById(params.id, { session }));
      validateTransition(before, body.status, body.resolution);
      const changes = { ...body };
      if (["resolved", "dismissed"].includes(body.status)) changes.resolvedAt = now(deps);
      const after = await repository.updateOne(
        { _id: params.id, status: before.status, version: before.version ?? 0 },
        { $set: changes, $inc: { version: 1 } },
        { session },
      );
      if (!after) throw AppError.conflict("Report was updated concurrently");
      await audit(deps, context, "report.update", "report", params.id, before, after, session);
      return after;
    });
  },
});
