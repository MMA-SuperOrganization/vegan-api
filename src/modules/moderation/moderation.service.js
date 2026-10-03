import { z } from "zod";
import { AppError } from "../../common/errors/app-error.js";
import {
  id,
  text,
  pagination,
  idParams,
  targetParams,
  targetTypes,
  admin,
  found,
  service,
  repository,
  rangeSchema,
  range,
  atomic,
  audit,
  now,
} from "../app-config/index.js";
import { reportStatuses, validateAssignee, validateTransition } from "../reports/index.js";
const priority = z.enum(["low", "normal", "high", "urgent"]);
const reportIds = z
  .array(id)
  .max(50)
  .refine((values) => new Set(values).size === values.length, "Duplicate report ids");
export const moderationValidation = {
  getModerationCases: {
    query: rangeSchema({
      ...pagination,
      status: z.enum(reportStatuses).optional(),
      priority: priority.optional(),
      assignedAdminId: id.optional(),
      targetType: z.enum(targetTypes).optional(),
    }),
  },
  createModerationCase: {
    body: z
      .object({
        targetType: z.enum(targetTypes),
        targetId: id,
        reportIds: reportIds.default([]),
        priority: priority.optional(),
        assignedAdminId: id.nullable().optional(),
      })
      .strict(),
  },
  updateModerationCase: {
    params: idParams,
    body: z
      .object({
        reportIds: reportIds.optional(),
        status: z.enum(reportStatuses).optional(),
        priority: priority.optional(),
        assignedAdminId: id.nullable().optional(),
        resolution: text(2000).optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
  },
  hideContent: {
    params: targetParams,
    body: z.object({ reason: text(2000), caseId: id.optional() }).strict(),
  },
  restoreContent: {
    params: targetParams,
    body: z.object({ reason: text(2000), caseId: id.optional() }).strict(),
  },
};
const assertReportLimit = (existing = [], additions = []) => {
  if (new Set([...existing, ...additions].map(String)).size > 50)
    throw AppError.badRequest("A moderation case can contain at most 50 reports");
};
export const createModerationService = (deps, cases) => {
  const target = async (type, id, actor, session) => {
    if (type === "user") {
      const account = found(
        await service(deps, "users", "getById")(id, { allowInactive: true, session }),
        "Target not found",
      );
      if (account.deletedAt || account.status === "deleted")
        throw AppError.notFound("Target not found");
      return account;
    }
    return service(deps, "content", "getTarget")(type, id, { actor, publicOnly: false, session });
  };
  const linkReports = async (ids, moderationCase, session, context) => {
    const reports = repository(deps, "reports");
    for (const id of ids) {
      const report = found(await reports.findById(id, { session }), "Report not found");
      if (
        report.targetType !== moderationCase.targetType ||
        String(report.targetId) !== String(moderationCase.targetId)
      )
        throw AppError.badRequest("Reports must refer to the same case target");
      if (report.moderationCaseId && String(report.moderationCaseId) !== String(moderationCase._id))
        throw AppError.conflict("Report is already linked to another case");
      if (["resolved", "dismissed"].includes(report.status))
        throw AppError.conflict("Closed reports cannot be linked to an active case");
      const changed = await reports.updateOne(
        { _id: id, version: report.version ?? 0 },
        {
          $set: {
            moderationCaseId: moderationCase._id,
            status: "reviewing",
            assignedAdminId: moderationCase.assignedAdminId,
          },
          $inc: { version: 1 },
        },
        { session },
      );
      if (!changed) throw AppError.conflict("Report was updated concurrently");
      await audit(deps, context, "report.link-case", "report", id, report, changed, session);
    }
  };
  const closeReports = async (moderationCase, session, context) => {
    if (!["resolved", "dismissed"].includes(moderationCase.status)) return;
    for (const id of moderationCase.reportIds ?? []) {
      const reports = repository(deps, "reports");
      const report = found(
        await reports.findOne({ _id: id, moderationCaseId: moderationCase._id }, { session }),
      );
      if (["resolved", "dismissed"].includes(report.status)) continue;
      const changed = await reports.updateOne(
        { _id: id, version: report.version ?? 0 },
        {
          $set: {
            status: moderationCase.status,
            resolution: moderationCase.resolution,
            resolvedAt: now(deps),
          },
          $inc: { version: 1 },
        },
        { session },
      );
      if (!changed) throw AppError.conflict("Report was updated concurrently");
      await audit(deps, context, "report.close-case", "report", id, report, changed, session);
    }
  };
  const visibility = async (context, hidden) => {
    const { actor, params, body } = context;
    admin(actor);
    return atomic(deps, async (session) => {
      const before = await target(params.targetType, params.targetId, actor, session);
      let moderationCase = body.caseId
        ? found(await cases.findById(body.caseId, { session }), "Moderation case not found")
        : await cases.findOne(
            {
              targetType: params.targetType,
              targetId: params.targetId,
              status: { $in: ["open", "reviewing"] },
            },
            { session },
          );
      if (
        moderationCase &&
        (moderationCase.targetType !== params.targetType ||
          String(moderationCase.targetId) !== params.targetId)
      )
        throw AppError.badRequest("Case target does not match content");
      if (moderationCase && ["resolved", "dismissed"].includes(moderationCase.status))
        throw AppError.conflict("Cannot add actions to a closed case");
      if (!moderationCase)
        moderationCase = await cases.create(
          {
            targetType: params.targetType,
            targetId: params.targetId,
            status: "reviewing",
            priority: "normal",
            assignedAdminId: actor.userId,
            reportIds: [],
            actions: [],
            version: 0,
          },
          { session },
        );
      const content = await service(
        deps,
        "content",
        "setVisibility",
      )({
        targetType: params.targetType,
        targetId: params.targetId,
        actor,
        hidden,
        reason: body.reason,
        requestId: context.requestId,
        ipHash: context.ipHash,
        session,
      });
      const after = await cases.updateOne(
        { _id: moderationCase._id, version: moderationCase.version ?? 0 },
        {
          $set: { status: "reviewing" },
          $push: {
            actions: {
              $each: [
                {
                  type: hidden ? "hide" : "restore",
                  actorId: actor.userId,
                  reason: body.reason,
                  beforeStatus: before.status,
                  afterStatus: content.status,
                  at: now(deps),
                },
              ],
              $slice: -100,
            },
          },
          $inc: { version: 1 },
        },
        { session },
      );
      if (!after) throw AppError.conflict("Case was updated concurrently");
      await audit(
        deps,
        context,
        hidden ? "moderation.hide" : "moderation.restore",
        "moderation-case",
        moderationCase._id,
        moderationCase,
        after,
        session,
      );
      return { content, moderationCase: after };
    });
  };
  return {
    async getModerationCases({ actor, query = {} }) {
      admin(actor);
      const filter = { createdAt: range(deps, query).filter };
      for (const key of ["status", "priority", "assignedAdminId", "targetType"])
        if (query[key]) filter[key] = query[key];
      return cases.findMany(filter, {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        sort: { createdAt: -1, _id: -1 },
      });
    },
    async createModerationCase(context) {
      const { actor, body } = context;
      admin(actor);
      await validateAssignee(deps, body.assignedAdminId);
      return atomic(deps, async (session) => {
        await target(body.targetType, body.targetId, actor, session);
        const before = await cases.findOne(
          {
            targetType: body.targetType,
            targetId: body.targetId,
            status: { $in: ["open", "reviewing"] },
          },
          { session },
        );
        let after = before;
        if (before) {
          assertReportLimit(before.reportIds, body.reportIds);
          after = await cases.updateOne(
            { _id: before._id, version: before.version ?? 0 },
            {
              $set: {
                priority: body.priority ?? before.priority,
                ...(body.assignedAdminId !== undefined
                  ? { assignedAdminId: body.assignedAdminId }
                  : {}),
              },
              $addToSet: { reportIds: { $each: body.reportIds ?? [] } },
              $inc: { version: 1 },
            },
            { session },
          );
          if (!after) throw AppError.conflict("Case was updated concurrently");
        } else
          after = await cases.create(
            {
              ...body,
              status: "open",
              reportIds: body.reportIds ?? [],
              priority: body.priority ?? "normal",
              actions: [],
              version: 0,
            },
            { session },
          );
        await linkReports(body.reportIds ?? [], after, session, context);
        await audit(
          deps,
          context,
          before ? "moderation-case.merge" : "moderation-case.create",
          "moderation-case",
          after._id,
          before,
          after,
          session,
        );
        return after;
      });
    },
    async updateModerationCase(context) {
      const { actor, body, params } = context;
      admin(actor);
      await validateAssignee(deps, body.assignedAdminId);
      return atomic(deps, async (session) => {
        const before = found(await cases.findById(params.id, { session }));
        validateTransition(before, body.status, body.resolution);
        if (body.reportIds?.length && ["resolved", "dismissed"].includes(before.status))
          throw AppError.conflict("Closed cases cannot merge reports");
        const { reportIds, ...changes } = body;
        assertReportLimit(before.reportIds, reportIds);
        if (["resolved", "dismissed"].includes(body.status)) changes.resolvedAt = now(deps);
        const update = { $set: changes, $inc: { version: 1 } };
        if (reportIds) update.$addToSet = { reportIds: { $each: reportIds } };
        const after = await cases.updateOne(
          { _id: params.id, version: before.version ?? 0, status: before.status },
          update,
          { session },
        );
        if (!after) throw AppError.conflict("Case was updated concurrently");
        if (reportIds) await linkReports(reportIds, after, session, context);
        await closeReports(after, session, context);
        await audit(
          deps,
          context,
          "moderation-case.update",
          "moderation-case",
          params.id,
          before,
          after,
          session,
        );
        return after;
      });
    },
    async hideContent(context) {
      return visibility(context, true);
    },
    async restoreContent(context) {
      return visibility(context, false);
    },
  };
};
