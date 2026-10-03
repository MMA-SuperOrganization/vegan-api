import { describe, it, expect } from "vitest";
import { validateDatabaseTestConfig } from "../helpers/database-safety.js";
describe("real database suite opt-in safety (offline)", () => {
  const good = {
    RUN_DATABASE_TESTS: "true",
    MONGODB_URI_TEST: "mongodb://localhost:27017/test_vegan_offline01?replicaSet=rs0",
  };
  it("does not enable on missing or partial opt-in", () => {
    expect(validateDatabaseTestConfig({})).toEqual({ enabled: false });
    expect(validateDatabaseTestConfig({ MONGODB_URI_TEST: good.MONGODB_URI_TEST })).toEqual({
      enabled: false,
    });
    expect(validateDatabaseTestConfig({ RUN_DATABASE_TESTS: "true" })).toEqual({ enabled: false });
  });
  it("accepts only dedicated named replica-set or Atlas test DB", () => {
    expect(validateDatabaseTestConfig(good)).toMatchObject({
      enabled: true,
      database: "test_vegan_offline01",
    });
    expect(
      validateDatabaseTestConfig({
        ...good,
        MONGODB_URI_TEST: "mongodb+srv://user:secret@cluster.example.test/test_vegan_offline02",
      }).enabled,
    ).toBe(true);
    for (const uri of [
      "mongodb://localhost:27017/vegan_support?replicaSet=rs0",
      "mongodb://localhost:27017/test_vegan_short?replicaSet=rs0",
      "mongodb://localhost:27017/test_vegan_offline01",
      "mongodb://localhost:27017/?replicaSet=rs0",
      "mongodb://CHANGE_ME/test_vegan_offline01?replicaSet=rs0",
    ])
      expect(() => validateDatabaseTestConfig({ ...good, MONGODB_URI_TEST: uri })).toThrow();
  });
  it("rejects application URI/database reuse even with different hosts or params", () => {
    expect(() =>
      validateDatabaseTestConfig({ ...good, MONGODB_URI: good.MONGODB_URI_TEST }),
    ).toThrow();
    expect(() =>
      validateDatabaseTestConfig({ ...good, MONGODB_DB_NAME: "test_vegan_offline01" }),
    ).toThrow();
    expect(() =>
      validateDatabaseTestConfig({
        ...good,
        MONGODB_URI: "mongodb://other-host:27017/test_vegan_offline01?replicaSet=other",
      }),
    ).toThrow();
  });
});
