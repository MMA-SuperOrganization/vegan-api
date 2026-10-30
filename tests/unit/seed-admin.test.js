import { describe, expect, it, vi } from "vitest";
import { provisionAdminAccount, validateAdminSeedConfig } from "../../scripts/seed-admin-core.js";

const seed = {
  adminEmail: "admin@vegeta.test",
  adminPassword: "StrongAdminPassword123!",
  adminDisplayName: "VEGETA Admin",
};

describe("admin account seed", () => {
  it("rejects placeholder and weak login configuration", () => {
    expect(() => validateAdminSeedConfig({ adminEmail: "CHANGE_ME" })).toThrow();
    expect(() =>
      validateAdminSeedConfig({ adminEmail: seed.adminEmail, adminPassword: "short" }),
    ).toThrow();
  });

  it("creates a Firebase login and promotes its local account", async () => {
    const firebaseAuth = {
      getUserByEmail: vi.fn().mockRejectedValue({ code: "auth/user-not-found" }),
      createUser: vi.fn().mockResolvedValue({ uid: "firebase-admin-uid" }),
      updateUser: vi.fn(),
    };
    const users = {
      findOne: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ role: "admin", status: "active" }),
    };

    const result = await provisionAdminAccount({ firebaseAuth, users, seed });

    expect(firebaseAuth.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: seed.adminEmail, emailVerified: true }),
    );
    expect(users.upsert).toHaveBeenCalledWith(
      { firebaseUid: "firebase-admin-uid" },
      expect.objectContaining({
        role: "admin",
        status: "active",
        onboardingCompleted: true,
      }),
    );
    expect(result.email).toBe(seed.adminEmail);
  });

  it("reactivates an existing Firebase admin identity idempotently", async () => {
    const firebaseAuth = {
      getUserByEmail: vi.fn().mockResolvedValue({ uid: "existing-admin" }),
      updateUser: vi.fn().mockResolvedValue({ uid: "existing-admin" }),
      createUser: vi.fn(),
    };
    const users = {
      findOne: vi.fn().mockResolvedValue({ firebaseUid: "existing-admin" }),
      upsert: vi.fn().mockResolvedValue({ role: "admin", status: "active" }),
    };

    await provisionAdminAccount({ firebaseAuth, users, seed });

    expect(firebaseAuth.createUser).not.toHaveBeenCalled();
    expect(firebaseAuth.updateUser).toHaveBeenCalledWith(
      "existing-admin",
      expect.objectContaining({ disabled: false, password: seed.adminPassword }),
    );
  });
});
