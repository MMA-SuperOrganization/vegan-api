import { AppError } from "../../common/errors/app-error.js";
import { admin, range, rangeSchema, pagination, id, text } from "../app-config/index.js";

const sensitive =
  /token|secret|password|authorization|cookie|credential|firebase|email|phone|medical|health|prompt|message|conversation|transcript|raw|providerresponse|errorstack|stack|signedurl|uploadurl|downloadurl|fcm|nutritionprofile|content|description|resolution|reason|bio|body|title|note/i;
export const sanitizeAudit = (value, depth = 0) => {
  if (value === undefined || value === null) return null;
  if (depth > 5) return "[truncated]";
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toHexString === "function") return value.toHexString();
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeAudit(item, depth + 1));
  if (typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 100)
        .filter(
          ([key]) =>
            !sensitive.test(key) && !["__proto__", "constructor", "prototype"].includes(key),
        )
        .map(([key, item]) => [key, sanitizeAudit(item, depth + 1)]),
    );
  if (typeof value === "string") {
    if (
      /bearer\s+|eyJ[a-zA-Z0-9_-]+\.|(?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]/i.test(
        value,
      )
    )
      return "[redacted]";
    return value.slice(0, 1000);
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  return null;
};
export const createAuditService = ({ repository, clock }) => ({
  async record({
    actor,
    actorId,
    actorRole,
    action,
    targetType,
    targetId,
    before,
    after,
    requestId,
    ipHash,
    session,
  }) {
    const author = actor?.userId ?? actorId;
    if (!author || !action || !targetType || !targetId)
      throw AppError.badRequest("Audit actor, action and target are required");
    return repository.create(
      {
        actorId: author,
        actorRole: actor?.role ?? actorRole ?? "system",
        action: String(action).slice(0, 100),
        targetType: String(targetType).slice(0, 80),
        targetId: String(targetId).slice(0, 100),
        before: sanitizeAudit(before),
        after: sanitizeAudit(after),
        requestId: requestId?.slice(0, 100),
        ipHash: ipHash?.slice(0, 128),
        createdAt: new Date(clock ? clock() : Date.now()),
      },
      { session },
    );
  },
});
export const auditValidation = {
  getAuditLogs: {
    query: rangeSchema({
      ...pagination,
      actorId: id.optional(),
      action: text(100).optional(),
      targetType: text(80).optional(),
      targetId: text(100).optional(),
    }),
  },
};
export const createAuditLogsService = (deps, repository) => ({
  async getAuditLogs({ actor, query = {} }) {
    admin(actor);
    const { filter: createdAt } = range(deps, query);
    const filter = { createdAt };
    for (const key of ["actorId", "action", "targetType", "targetId"])
      if (query[key]) filter[key] = query[key];
    const result = await repository.findMany(filter, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sort: { createdAt: -1, _id: -1 },
    });
    return { ...result, data: result.data.map((entry) => sanitizeAudit(entry)) };
  },
});
