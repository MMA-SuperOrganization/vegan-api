import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, TEST_TOKENS } from "../helpers/test-app.js";

const FOOD = "200000000000000000000001";
const INACTIVE = "200000000000000000000002";
const now = new Date("2026-10-20T10:00:00Z");

function fixture() {
  const context = buildTestApp({
    clock: () => now,
    seed: {
      foodItems: [
        { _id: FOOD, name: "Tofu", slug: "tofu", status: "active" },
        { _id: INACTIVE, name: "Old food", slug: "old-food", status: "inactive" },
      ],
    },
  });
  const call = (method, path = "", token = TEST_TOKENS.user) => {
    const operation = request(context.app)[method](`/api/v1/pantry${path}`);
    return token ? operation.set("Authorization", `Bearer ${token}`) : operation;
  };
  const add = (input = {}) =>
    call("post", "/items").send({ foodItemId: FOOD, quantity: 500, unit: "g", ...input });
  return { ...context, call, add };
}

describe("manual pantry mobile flow", () => {
  it("supports empty inventory, add, reload, edit, clear expiry/note, and delete", async () => {
    const { call, add } = fixture();
    const empty = await call("get");
    expect(empty.status).toBe(200);
    expect(empty.body.data.items).toEqual([]);
    expect(empty.body.data).not.toHaveProperty("bulkRequests");

    const created = await add({ expiresAt: "2026-10-25T16:59:59.999Z", note: "Refrigerate" });
    expect(created.status).toBe(200);
    const item = created.body.data.items[0];
    expect(item).toMatchObject({
      foodItemId: FOOD,
      foodNameSnapshot: "Tofu",
      quantity: 500,
      unit: "g",
      note: "Refrigerate",
    });
    expect(item.itemId).toMatch(/^[a-f\d-]{36}$/i);
    expect(item.addedAt).toBe(now.toISOString());
    const loaded = await call("get");
    expect(loaded.body.data.items).toEqual(created.body.data.items);

    const edited = await call("patch", `/items/${item.itemId}`).send({
      quantity: 0.25,
      unit: "kg",
      note: "",
      expiresAt: null,
    });
    expect(edited.status).toBe(200);
    expect(edited.body.data.items[0]).toMatchObject({
      itemId: item.itemId,
      foodItemId: FOOD,
      quantity: 0.25,
      unit: "kg",
      note: "",
      expiresAt: null,
    });
    expect(edited.body.data.version).toBeGreaterThan(created.body.data.version);
    const deleted = await call("delete", `/items/${item.itemId}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data._id).toBe(empty.body.data._id);
    expect(deleted.body.data.items).toEqual([]);
    expect((await call("get")).body.data.items).toEqual([]);
  });

  it("isolates every user's pantry and rejects changes to another user's item", async () => {
    const { call, add } = fixture();
    const created = await add();
    const itemId = created.body.data.items[0].itemId;
    const other = await call("get", "", TEST_TOKENS.other);
    expect(other.status).toBe(200);
    expect(other.body.data.items).toEqual([]);
    expect(
      (await call("patch", `/items/${itemId}`, TEST_TOKENS.other).send({ quantity: 1 })).status,
    ).toBe(404);
    expect((await call("delete", `/items/${itemId}`, TEST_TOKENS.other)).status).toBe(404);
    expect((await call("get")).body.data.items[0].quantity).toBe(500);
    for (const [method, path, body] of [
      ["get", ""],
      ["post", "/items", {}],
      ["patch", `/items/${itemId}`, { quantity: 1 }],
      ["delete", `/items/${itemId}`],
      ["get", "/expiring"],
    ]) {
      let operation = call(method, path, null);
      if (body) operation = operation.send(body);
      expect((await operation).status).toBe(401);
    }
  });

  it("rejects malformed input and unavailable foods without adding ingredients", async () => {
    const { call, add } = fixture();
    for (const input of [
      { quantity: 0 },
      { quantity: -1 },
      { quantity: 1_000_001 },
      { unit: "bag" },
      { foodItemId: "invalid" },
      { expiresAt: "2026-02-30T00:00:00Z" },
      { note: "x".repeat(1001) },
      { foodNameSnapshot: "Spoofed name" },
    ]) {
      expect((await add(input)).status, JSON.stringify(input)).toBe(400);
    }
    expect((await add({ foodItemId: INACTIVE })).status).toBe(404);
    expect((await add({ foodItemId: "200000000000000000000099" })).status).toBe(404);
    expect((await call("get")).body.data.items).toEqual([]);
    const created = await add();
    const itemId = created.body.data.items[0].itemId;
    expect((await call("patch", `/items/${itemId}`).send({})).status).toBe(400);
    expect((await call("patch", `/items/${itemId}`).send({ foodItemId: INACTIVE })).status).toBe(
      400,
    );
    expect((await call("patch", `/items/${itemId}`).send({ quantity: 0 })).status).toBe(400);
    expect((await call("get")).body.data.items[0].quantity).toBe(500);
  });

  it("filters, orders, and paginates expiring ingredients without leaking another user's inventory", async () => {
    const { call, add } = fixture();
    const dates = [
      "2026-10-19T10:00:00Z",
      "2026-10-21T10:00:00Z",
      "2026-10-27T10:00:00Z",
      "2026-10-28T10:00:00Z",
    ];
    for (const expiresAt of dates) expect((await add({ expiresAt })).status).toBe(200);
    await add();
    const soon = await call("get", "/expiring?days=7&limit=1&page=1");
    expect(soon.status).toBe(200);
    expect(soon.body.data).toHaveLength(1);
    expect(soon.body.data[0].expiresAt).toBe(new Date(dates[1]).toISOString());
    expect(soon.body.meta).toMatchObject({ total: 2, totalPages: 2 });
    const next = await call("get", "/expiring?days=7&limit=1&page=2");
    expect(next.body.data[0].expiresAt).toBe(new Date(dates[2]).toISOString());
    const withExpired = await call("get", "/expiring?days=7&includeExpired=true");
    expect(withExpired.body.data).toHaveLength(3);
    expect((await call("get", "/expiring", TEST_TOKENS.other)).body.data).toEqual([]);
  });
});
