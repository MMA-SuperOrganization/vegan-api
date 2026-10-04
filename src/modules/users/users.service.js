import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "../../common/errors/app-error.js";
import { id, text, url } from "../../common/validators/domain.schemas.js";
import { profileSchema } from "./users.validation.js";
import { redact } from "../../common/domain.js";

const uid = (value) => id.parse(String(value));
const pick = (value, keys) =>
  Object.fromEntries(
    keys.filter((key) => value?.[key] !== undefined).map((key) => [key, value[key]]),
  );
const account = (user) =>
  user
    ? {
        ...pick(user, [
          "email",
          "displayName",
          "avatarUrl",
          "avatarMediaId",
          "role",
          "status",
          "onboardingCompleted",
          "lastLoginAt",
          "createdAt",
          "updatedAt",
          "deletedAt",
        ]),
        _id: String(user._id),
        userId: String(user._id),
      }
    : null;
const publicAccount = (user) => ({
  userId: String(user._id),
  ...pick(user, ["displayName", "avatarUrl"]),
});
const profile = (value) =>
  value
    ? pick(value, [
        "_id",
        "userId",
        "bio",
        "dateOfBirth",
        "gender",
        "dietType",
        "preferredCuisines",
        "dislikedFoodItemIds",
        "locale",
        "timezone",
        "createdAt",
        "updatedAt",
      ])
    : null;
const found = (value, name = "User") => {
  if (!value) throw AppError.notFound(`${name} not found`);
  return value;
};
const active = (user) => {
  if (user.status !== "active")
    throw AppError.forbidden(
      "Account is not active",
      `ACCOUNT_${String(user.status).toUpperCase()}`,
    );
  return user;
};
const requireActor = (actor) => {
  if (!actor?.userId) throw AppError.unauthorized();
  if (actor.status !== "active") throw AppError.forbidden("Account is not active");
  return uid(actor.userId);
};
const requireAdmin = (actor) => {
  requireActor(actor);
  if (actor.role !== "admin") throw AppError.forbidden();
};
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createUsersService = ({ deps, users, profiles, guards }) => {
  const now = () =>
    new Date(typeof deps.clock === "function" ? deps.clock() : (deps.clock?.now?.() ?? Date.now()));
  const presentAccount = async (user) => {
    const output = account(user);
    if (user?.avatarMediaId) {
      if (!deps.services?.media) throw AppError.serviceUnavailable("Media service unavailable");
      const media = await deps.services.media.getById(user.avatarMediaId, {});
      output.avatarUrl = media.downloadUrl;
      output.avatarExpiresAt = media.expiresAt;
    }
    return output;
  };
  let queue = Promise.resolve();
  const serialized = (work) => {
    const result = queue.then(work, work);
    queue = result.catch(() => {});
    return result;
  };
  const transaction = (work) => {
    if (!deps.transaction)
      throw AppError.serviceUnavailable("Transaction support is required", "TRANSACTIONS_REQUIRED");
    return deps.transaction(work);
  };
  const load = async (userId, options = {}) => found(await users.findById(uid(userId), options));
  const owner = async (actor, options = {}) => active(await load(requireActor(actor), options));
  const audit = async ({ actor, action, targetId, before, after, requestId, ipHash }, session) => {
    if (!deps.audit?.record) throw AppError.serviceUnavailable("Audit service is unavailable");
    await deps.audit.record(
      {
        actor,
        action,
        targetType: "user",
        targetId: String(targetId),
        before: redact(account(before)),
        after: redact(account(after)),
        requestId,
        ipHash,
        session,
      },
      { session },
    );
  };
  const protectLastAdmin = async (before, changes, session) => {
    // Writing the same guard in the transaction turns last-admin reads into a serializable decision across processes.
    if (session || deps.repositories?.adminGuards)
      await guards.updateOne(
        { _id: "active-admins" },
        { $inc: { version: 1 } },
        { upsert: true, session },
      );
    if (
      before.role === "admin" &&
      before.status === "active" &&
      (changes.role === "user" || ["suspended", "deleted"].includes(changes.status))
    ) {
      if ((await users.count({ role: "admin", status: "active" }, { session })) <= 1)
        throw AppError.conflict("Cannot remove the last active administrator", [], "LAST_ADMIN");
    }
  };
  const syncAccount = async (identity) => {
    const firebaseUid = text(128).parse(identity?.firebaseUid ?? identity?.uid);
    let user = await users.findOne({ firebaseUid });
    if (user) active(user);
    const set = { lastLoginAt: now() };
    if (identity.email != null)
      set.email = z.email().max(320).parse(String(identity.email).trim().toLowerCase());
    const displayName = identity.displayName ?? identity.name;
    const avatarUrl = identity.avatarUrl ?? identity.picture;
    if (displayName) set.displayName = text(100).parse(displayName);
    if (avatarUrl && !user?.avatarMediaId) set.avatarUrl = url.max(2048).parse(avatarUrl);
    try {
      user = await users.updateOne(
        { firebaseUid, status: user ? "active" : { $ne: "deleted" } },
        {
          $set: set,
          $setOnInsert: {
            firebaseUid,
            role: "user",
            status: "active",
            onboardingCompleted: false,
            fcmTokens: [],
          },
        },
        { upsert: !user, new: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      user = await users.findOne({ firebaseUid });
      active(found(user));
      user = await users.updateOne(
        { _id: user._id, status: "active" },
        { $set: set },
        { new: true },
      );
    }
    return presentAccount(active(found(user)));
  };
  const resolveIdentity = async (identity) => {
    const firebaseUid = text(128).parse(
      typeof identity === "string" ? identity : (identity?.firebaseUid ?? identity?.uid),
    );
    const user = await users.findOne({ firebaseUid });
    if (!user) throw AppError.notFound("Account must be synchronized first", "ACCOUNT_NOT_SYNCED");
    active(user);
    return {
      userId: String(user._id),
      firebaseUid: user.firebaseUid,
      role: user.role,
      status: user.status,
    };
  };
  const getProfile = async (userId, options = {}) =>
    profile(await profiles.findOne({ userId: uid(userId) }, options));
  const upsertProfile = async (userId, body, options = {}) => {
    body = profileSchema.parse(body);
    active(await load(userId, options));
    if (body.dislikedFoodItemIds?.length) {
      if (!deps.services?.foodItems?.getMany)
        throw AppError.serviceUnavailable("Food item service unavailable");
      await deps.services.foodItems.getMany(body.dislikedFoodItemIds, options);
    }
    const data = { ...body };
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    return profile(
      await profiles.updateOne(
        { userId: uid(userId) },
        { $set: data, $setOnInsert: { userId: uid(userId) } },
        { ...options, upsert: true, new: true },
      ),
    );
  };
  const getNutrition = (userId, options = {}) => {
    if (!deps.services?.nutritionProfiles?.getByUserId)
      throw AppError.serviceUnavailable("Nutrition service unavailable");
    return deps.services.nutritionProfiles.getByUserId(uid(userId), options);
  };
  const getSummary = async (actor) => {
    const user = await owner(actor);
    const [fullProfile, nutritionProfile] = await Promise.all([
      getProfile(user._id),
      getNutrition(user._id),
    ]);
    return { user: await presentAccount(user), profile: fullProfile, nutritionProfile };
  };
  const editTokens = async (userId, edit, options = {}) => {
    for (let retry = 0; retry < 5; retry += 1) {
      const user = active(
        found(
          await users.findById(uid(userId), {
            ...options,
            projection: { fcmTokens: 1, fcmTokensVersion: 1, status: 1 },
          }),
        ),
      );
      const before = user.fcmTokens ?? [];
      const after = edit(before);
      const updated = await users.updateOne(
        {
          _id: user._id,
          status: "active",
          fcmTokensVersion: user.fcmTokensVersion ?? { $exists: false },
        },
        { $set: { fcmTokens: after }, $inc: { fcmTokensVersion: 1 } },
        { ...options, new: true },
      );
      if (updated) return after;
    }
    throw AppError.conflict(
      "Device registrations changed concurrently; retry",
      [],
      "VERSION_CONFLICT",
    );
  };
  const operations = {
    getMyProfileSummary: ({ actor }) => getSummary(actor),
    async updateMyProfile(context) {
      const avatarChange =
        Object.hasOwn(context.body, "avatarMediaId") || Object.hasOwn(context.body, "avatarUrl");
      const work = async (session) => {
        const before = await owner(context.actor, { session });
        const changes = { ...context.body };
        if (avatarChange) {
          const nextId = context.body.avatarMediaId ?? null;
          const media = deps.services.media;
          if (nextId) {
            await media.assertReady([nextId], {
              actor: context.actor,
              ownerId: before._id,
              kind: "image",
              purpose: "avatar",
              session,
            });
            if (String(nextId) !== String(before.avatarMediaId))
              await media.link(nextId, "user", before._id, { actor: context.actor, session });
          }
          if (before.avatarMediaId && String(nextId) !== String(before.avatarMediaId))
            await media.unlink(before.avatarMediaId, "user", before._id, {
              actor: context.actor,
              session,
            });
          changes.avatarMediaId = nextId;
          changes.avatarUrl = null;
        }
        const after = found(
          await users.updateOne(
            { _id: before._id, status: "active" },
            { $set: changes },
            { session, new: true },
          ),
        );
        if (context.actor.role === "admin")
          await audit(
            { ...context, action: "user.profile.update", targetId: before._id, before, after },
            session,
          );
        return after;
      };
      const after =
        avatarChange || context.actor?.role === "admin" ? await transaction(work) : await work();
      return presentAccount(after);
    },
    async deleteMyAccount(context) {
      const user = await owner(context.actor);
      const remove = async (session) => {
        const before = await load(user._id, { session });
        active(before);
        const changes = {
          status: "deleted",
          deletedAt: now(),
          fcmTokens: [],
          onboardingCompleted: false,
          avatarMediaId: null,
          avatarUrl: null,
        };
        if (before.avatarMediaId)
          await deps.services.media.unlink(before.avatarMediaId, "user", before._id, {
            actor: context.actor,
            session,
          });
        if (before.role === "admin") await protectLastAdmin(before, changes, session);
        const after = found(
          await users.updateOne(
            { _id: before._id, status: "active" },
            { $set: changes, $inc: { fcmTokensVersion: 1 } },
            { session, new: true },
          ),
        );
        if (before.role === "admin")
          await audit(
            { ...context, action: "user.delete", targetId: before._id, before, after },
            session,
          );
        return { userId: String(after._id), status: after.status, deletedAt: after.deletedAt };
      };
      return serialized(() => transaction(remove));
    },
    async getPublicUserProfile({ params }) {
      const user = await users.findOne({ _id: uid(params.userId), status: "active" });
      found(user);
      const fullProfile = await getProfile(user._id);
      const presented = await presentAccount(user);
      return {
        ...publicAccount(presented),
        ...(user.avatarMediaId
          ? {
              avatarMediaId: String(user.avatarMediaId),
              avatarExpiresAt: presented.avatarExpiresAt,
            }
          : {}),
        ...pick(fullProfile, ["bio", "dietType", "preferredCuisines"]),
      };
    },
    async getMyContent({ actor, query }) {
      await owner(actor);
      if (deps.services?.content?.getMyContent)
        return deps.services.content.getMyContent(actor, query);
      const key = { recipe: "recipes", post: "posts", video: "videos" }[query.type ?? "recipe"];
      const repository = deps.repositories[key];
      if (!repository) throw AppError.serviceUnavailable("Content service unavailable");
      return repository.findMany(
        { authorId: uid(actor.userId), ...(query.status ? { status: query.status } : {}) },
        { page: query.page, limit: query.limit, sort: { updatedAt: -1, _id: -1 } },
      );
    },
    async getMyActivity({ actor }) {
      await owner(actor);
      if (deps.services?.content?.getMyActivity) return deps.services.content.getMyActivity(actor);
      const counts = await Promise.all(
        [
          "recipes",
          "posts",
          "videos",
          "comments",
          "reactions",
          "savedItems",
          "ratings",
          "viewHistories",
        ].map(async (key) => {
          const repo = deps.repositories[key];
          return [
            key,
            repo
              ? await repo.count({
                  [["recipes", "posts", "videos", "comments"].includes(key)
                    ? "authorId"
                    : "userId"]: uid(actor.userId),
                })
              : 0,
          ];
        }),
      );
      return { userId: uid(actor.userId), counts: Object.fromEntries(counts) };
    },
    async getMyFullProfile({ actor }) {
      const user = await owner(actor);
      return getProfile(user._id);
    },
    async upsertMyProfile(context) {
      const work = async (session) => {
        const user = await owner(context.actor, { session });
        const before = await getProfile(user._id, { session });
        const after = await upsertProfile(user._id, context.body, { session });
        if (context.actor.role === "admin")
          await deps.audit.record({
            actor: context.actor,
            action: "userProfile.upsert",
            targetType: "userProfile",
            targetId: String(user._id),
            before: redact(pick(before, ["userId", "dietType", "locale", "timezone"])),
            after: redact(pick(after, ["userId", "dietType", "locale", "timezone"])),
            requestId: context.requestId,
            ipHash: context.ipHash,
            session,
          });
        return after;
      };
      if (context.actor?.role === "admin" && !deps.audit?.record)
        throw AppError.serviceUnavailable("Audit service unavailable");
      return context.actor?.role === "admin" ? transaction(work) : work();
    },
    suspendUser: (context) =>
      changeAdminAccount(context, { status: "suspended", fcmTokens: [] }, "user.suspend"),
    activateUser: (context) => changeAdminAccount(context, { status: "active" }, "user.activate"),
    changeUserRole: (context) =>
      changeAdminAccount(context, { role: context.body.role }, "user.role.change"),
    async getAdminUsers({ actor, query }) {
      requireAdmin(actor);
      await owner(actor);
      const filter = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.role ? { role: query.role } : {}),
      };
      if (query.q)
        filter.$or = ["displayName", "email"].map((key) => ({
          [key]: { $regex: escaped(query.q), $options: "i" },
        }));
      const result = await users.findMany(filter, {
        page: query.page,
        limit: query.limit,
        projection: "-fcmTokens -firebaseUid",
        sort: { createdAt: -1, _id: -1 },
      });
      return { ...result, data: result.data.map(account) };
    },
    async getAdminUserDetail(context) {
      requireAdmin(context.actor);
      await owner(context.actor);
      const user = await load(context.params.id);
      await audit({
        ...context,
        action: "user.read",
        targetId: user._id,
        before: null,
        after: user,
      });
      return {
        user: await presentAccount(user),
        profile: pick(await getProfile(user._id), ["bio", "dietType", "locale", "timezone"]),
      };
    },
  };
  const changeAdminAccount = (context, changes, action) => {
    requireAdmin(context.actor);
    return serialized(() =>
      transaction(async (session) => {
        const administrator = await owner(context.actor, { session });
        if (administrator.role !== "admin") throw AppError.forbidden();
        const before = await load(context.params.id, { session });
        if (before.status === "deleted")
          throw AppError.conflict("Deleted accounts cannot be reactivated or changed");
        await protectLastAdmin(before, changes, session);
        const after = found(
          await users.updateOne(
            { _id: before._id, status: before.status, role: before.role },
            {
              $set: changes,
              ...(changes.fcmTokens !== undefined ? { $inc: { fcmTokensVersion: 1 } } : {}),
            },
            { session, new: true },
          ),
        );
        await audit({ ...context, action, targetId: before._id, before, after }, session);
        return account(after);
      }),
    );
  };
  const services = {
    resolveIdentity,
    syncAccount,
    getSummary,
    getProfile,
    getNutrition,
    upsertProfile,
    async getById(userId, options = {}) {
      const user = await load(userId, options);
      if (!options.allowInactive) active(user);
      return account(user);
    },
    async setOnboardingCompleted(userId, completed, options = {}) {
      return account(
        found(
          await users.updateOne(
            { _id: uid(userId), status: "active" },
            { $set: { onboardingCompleted: completed } },
            { ...options, new: true },
          ),
        ),
      );
    },
    async getFcmTokens(userId) {
      const user = await users.findOne(
        { _id: uid(userId), status: "active" },
        { projection: { fcmTokens: 1 } },
      );
      return user?.fcmTokens ?? [];
    },
    async removeFcmTokens(userId, tokens) {
      const values = tokens.map((v) => (typeof v === "string" ? v : v.token));
      await users.updateOne(
        { _id: uid(userId) },
        { $pull: { fcmTokens: { token: { $in: values } } }, $inc: { fcmTokensVersion: 1 } },
      );
    },
    async registerFcmToken(actor, body, options = {}) {
      await owner(actor, options);
      const existingOwner = await users.findOne(
        { "fcmTokens.token": body.token, _id: { $ne: uid(actor.userId) } },
        { ...options, projection: "_id" },
      );
      if (existingOwner)
        throw AppError.conflict(
          "Device token is already registered to another account",
          [],
          "FCM_TOKEN_CONFLICT",
        );
      let record;
      await editTokens(
        actor.userId,
        (tokens) => {
          const existing = tokens.find((v) => v.token === body.token);
          record = {
            tokenId: existing?.tokenId ?? randomUUID(),
            token: body.token,
            platform: body.platform ?? "android",
            deviceName: body.deviceName,
            lastUsedAt: now(),
          };
          const rest = tokens.filter((v) => v.token !== body.token);
          if (rest.length >= 20) throw AppError.conflict("At most 20 devices may be registered");
          return [...rest, record];
        },
        options,
      );
      return pick(record, ["tokenId", "platform", "deviceName", "lastUsedAt"]);
    },
    async unregisterFcmToken(actor, tokenId, options = {}) {
      await owner(actor, options);
      await editTokens(
        actor.userId,
        (tokens) => tokens.filter((v) => v.tokenId !== tokenId),
        options,
      );
      return { tokenId, removed: true };
    },
  };
  return { operations, services };
};
