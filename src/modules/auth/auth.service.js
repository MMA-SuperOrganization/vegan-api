import { AppError } from "../../common/errors/app-error.js";
export const createAuthService = (deps) => {
  const users = () => {
    if (!deps.services?.users) throw AppError.serviceUnavailable("User service unavailable");
    return deps.services.users;
  };
  const auditedDeviceMutation = async (context, action, work) => {
    if (context.actor?.role !== "admin") return work({});
    if (!deps.audit?.record || !deps.transaction)
      throw AppError.serviceUnavailable("Transaction and audit support are required");
    return deps.transaction(async (session) => {
      const result = await work({ session });
      await deps.audit.record({
        actor: context.actor,
        action,
        targetType: "user",
        targetId: String(context.actor.userId),
        before: null,
        after: { tokenId: result.tokenId },
        requestId: context.requestId,
        ipHash: context.ipHash,
        session,
      });
      return result;
    });
  };
  const operations = {
    syncAuth: ({ actor }) => users().syncAccount(actor),
    getMe: ({ actor }) => users().getSummary(actor),
    addFcmToken: (context) =>
      auditedDeviceMutation(context, "user.fcm.register", (options) =>
        users().registerFcmToken(context.actor, context.body, options),
      ),
    removeFcmToken: (context) =>
      auditedDeviceMutation(context, "user.fcm.remove", (options) =>
        users().unregisterFcmToken(context.actor, context.params.tokenId, options),
      ),
  };
  return operations;
};
