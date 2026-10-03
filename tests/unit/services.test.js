import { describe, expect, it, vi } from "vitest";
import { createUsersModule } from "../../src/modules/users/index.js";
import { createMediaService } from "../../src/modules/media/media.service.js";
import { createMemoryRepositories, memoryTransaction } from "../helpers/memory-repositories.js";
const USER = "100000000000000000000001";
const userFixture = (status = "active") => {
  const repositories = createMemoryRepositories({
    users: [
      {
        _id: USER,
        firebaseUid: "uid",
        email: "a@b.com",
        role: "user",
        status,
        lastLoginAt: new Date("2026-01-01T10:00:00Z"),
        fcmTokens: [],
      },
    ],
  });
  const deps = {
    repositories,
    services: {},
    clock: () => new Date("2026-01-01T11:00:00Z"),
    transaction: memoryTransaction(repositories),
    audit: { record: vi.fn() },
  };
  const module = createUsersModule(deps);
  Object.assign(deps.services, module.services);
  return { service: module.services.users, module, repositories };
};
describe("canonical user service", () => {
  it("does not write login timestamps during routine authenticated identity resolution", async () => {
    const { service, repositories } = userFixture();
    const spy = vi.spyOn(repositories.users, "updateOne");
    await service.resolveIdentity({ firebaseUid: "uid", email: "changed@example.com" });
    expect(spy).not.toHaveBeenCalled();
    await service.syncAccount({ firebaseUid: "uid", email: "a@b.com" });
    expect(spy).toHaveBeenCalledOnce();
    expect((await repositories.users.findById(USER)).lastLoginAt).toEqual(
      new Date("2026-01-01T11:00:00Z"),
    );
  });
  it("recovers a duplicate-key first synchronization race without assigning admin role", async () => {
    const { service, repositories } = userFixture();
    vi.spyOn(repositories.users, "findOne")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(await repositories.users.findById(USER));
    const original = repositories.users.updateOne.bind(repositories.users);
    vi.spyOn(repositories.users, "updateOne")
      .mockRejectedValueOnce(Object.assign(new Error("duplicate"), { code: 11000 }))
      .mockImplementation(original);
    await expect(
      service.syncAccount({ firebaseUid: "uid", email: "a@b.com", role: "admin" }),
    ).resolves.toMatchObject({ userId: USER, role: "user" });
  });
  it.each([
    ["suspended", "ACCOUNT_SUSPENDED"],
    ["deleted", "ACCOUNT_DELETED"],
  ])("blocks %s accounts in identity resolution and sync", async (status, code) => {
    const { service } = userFixture(status);
    await expect(service.resolveIdentity("uid")).rejects.toMatchObject({ statusCode: 403, code });
    await expect(service.syncAccount({ firebaseUid: "uid" })).rejects.toMatchObject({
      statusCode: 403,
      code,
    });
  });
  it("allows keeping the same display name without changing credentials or privilege", async () => {
    const { module, repositories } = userFixture();
    await module.operations.updateMyProfile({
      actor: { userId: USER, status: "active", role: "user" },
      body: { displayName: "Same name" },
    });
    const result = await module.operations.updateMyProfile({
      actor: { userId: USER, status: "active", role: "user" },
      body: { displayName: "Same name" },
    });
    expect(result.displayName).toBe("Same name");
    expect((await repositories.users.findById(USER)).role).toBe("user");
  });
});
describe("canonical media service", () => {
  it("denies linking a ready asset owned by another account", async () => {
    const asset = "200000000000000000000001";
    const repositories = createMemoryRepositories({
      mediaAssets: [
        {
          _id: asset,
          ownerId: "100000000000000000000002",
          status: "ready",
          kind: "image",
          purpose: "recipe",
        },
      ],
    });
    const { service } = createMediaService({ repositories });
    await expect(
      service.assertReady([asset], { actor: { userId: USER, role: "user", status: "active" } }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
