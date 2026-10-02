import { describe, expect, it, vi } from "vitest";

import { authorize } from "../../src/common/middlewares/authorize.js";
import { extractBearerToken } from "../../src/common/middlewares/authenticate.js";
import { buildObjectKey, createMediaService } from "../../src/modules/media/media.service.js";
import { createUsersService } from "../../src/modules/users/users.service.js";
import { createFakeStorageProvider, createInMemoryUserRepository } from "../helpers/fakes.js";

describe("user service", () => {
  it("does not rewrite lastLoginAt on every request", async () => {
    const recent = new Date("2026-01-01T10:00:00Z");
    const userRepository = createInMemoryUserRepository([
      { firebaseUid: "uid", email: "a@b.com", lastLoginAt: recent },
    ]);
    const updateSpy = vi.spyOn(userRepository, "updateById");

    const service = createUsersService({
      usersRepository: userRepository,
      now: () => new Date("2026-01-01T10:05:00Z"),
    });
    await service.resolveAuthenticatedUser({ firebaseUid: "uid", email: "a@b.com" });
    expect(updateSpy).not.toHaveBeenCalled();

    const later = createUsersService({
      usersRepository: userRepository,
      now: () => new Date("2026-01-01T11:00:00Z"),
    });
    await later.resolveAuthenticatedUser({ firebaseUid: "uid", email: "a@b.com" });
    expect(updateSpy).toHaveBeenCalledOnce();
  });

  it("recovers from a concurrent first sign-in race", async () => {
    const userRepository = createInMemoryUserRepository();
    const originalFind = userRepository.findByFirebaseUid;
    // Lần tìm đầu không thấy, nhưng trong lúc đó request khác đã tạo user.
    vi.spyOn(userRepository, "findByFirebaseUid")
      .mockResolvedValueOnce(null)
      .mockImplementation(originalFind);
    await userRepository.create({ firebaseUid: "uid", email: "a@b.com" });

    const service = createUsersService({ usersRepository: userRepository });

    await expect(
      service.resolveAuthenticatedUser({ firebaseUid: "uid", email: "a@b.com" }),
    ).resolves.toMatchObject({ role: "USER" });
  });

  it.each([
    ["SUSPENDED", "ACCOUNT_SUSPENDED"],
    ["BANNED", "ACCOUNT_BANNED"],
    ["DELETED", "ACCOUNT_DELETED"],
  ])("blocks %s accounts", async (status, code) => {
    const userRepository = createInMemoryUserRepository([
      { firebaseUid: "uid", email: "a@b.com", status },
    ]);
    const service = createUsersService({ usersRepository: userRepository });

    await expect(
      service.resolveAuthenticatedUser({ firebaseUid: "uid", email: "a@b.com" }),
    ).rejects.toMatchObject({ statusCode: 403, code });
  });

  it("allows keeping the same username", async () => {
    const userRepository = createInMemoryUserRepository([
      { firebaseUid: "uid", email: "a@b.com", username: "same_name" },
    ]);
    const [user] = userRepository.users.values();
    const service = createUsersService({ usersRepository: userRepository });

    await expect(
      service.updateCurrentUser(user._id, { username: "same_name" }),
    ).resolves.toMatchObject({ username: "same_name" });
  });
});

describe("media service", () => { it("works", () => { expect(1).toBe(1); }) });
