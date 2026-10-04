import fs from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { runPreflight } from "../../scripts/preflight.js";
import { planActiveSlots, parseProvisionArgs } from "../../scripts/provision-indexes.js";
import { buildTestApp } from "../helpers/test-app.js";
import { createApp } from "../../src/app.js";
import request from "supertest";

describe("maintenance and integration preflight", () => {
  it("reports verified/failed/skipped checks without leaking raw provider errors", async () => {
    const checks = {
      database: vi.fn(async () => {}),
      r2: vi.fn(async () => {
        throw new Error("SECRET endpoint password");
      }),
      ai: null,
    };
    const result = await runPreflight(checks);
    expect(result).toEqual([
      { name: "database", status: "verified" },
      { name: "r2", status: "failed" },
      { name: "ai", status: "skipped" },
    ]);
    expect(JSON.stringify(result)).not.toContain("SECRET");
  });
  it("bounds unresponsive preflight checks and signals cancellation", async () => {
    let signal;
    const result = await runPreflight(
      {
        provider: (input) => {
          signal = input;
          return new Promise(() => {});
        },
      },
      { timeoutMs: 5 },
    );
    expect(result[0].status).toBe("failed");
    expect(signal.aborted).toBe(true);
  });
  it("requires maintenance mode for index writes and detects inconsistent active pointers", () => {
    expect(parseProvisionArgs([]).apply).toBe(false);
    expect(() => parseProvisionArgs(["--apply"])).toThrow(/maintenance/);
    expect(() => parseProvisionArgs(["--retire-old-active-index"])).toThrow();
    const plan = { _id: "plan", userId: "owner", weekStartDate: new Date("2030-01-07") };
    expect(planActiveSlots([plan], [])).toEqual([plan]);
    expect(planActiveSlots([plan], [{ ...plan, activePlanId: "plan" }])).toEqual([]);
    expect(() => planActiveSlots([plan, { ...plan, _id: "other" }], [])).toThrow(/Conflicting/);
    expect(() => planActiveSlots([plan], [{ ...plan, activePlanId: "other" }])).toThrow(
      /disagrees/,
    );
  });
});
describe("runtime architecture and proxy boundaries", () => {
  it("wires every manifest operation through a concrete module controller", () => {
    const { container } = buildTestApp();
    expect(Object.keys(container.controllers).sort()).toEqual(
      Object.keys(container.operations).sort(),
    );
    for (const module of container.modules)
      expect(Object.keys(module.controllers).sort()).toEqual(Object.keys(module.operations).sort());
    for (const domain of fs.readdirSync(new URL("../../src/modules/", import.meta.url))) {
      const root = new URL(`../../src/modules/${domain}/`, import.meta.url);
      for (const file of fs.readdirSync(root).filter((file) => file.endsWith(".js"))) {
        const source = fs.readFileSync(new URL(file, root), "utf8");
        for (const match of source.matchAll(/from\s+["']\.\.\/([^/]+)\/([^"']+)["']/g))
          if (match[1] !== "..")
            expect(match[2], `${domain}/${file} imports another domain's internal file`).toBe(
              "index.js",
            );
      }
    }
  });
  it("ignores spoofed forwarded IPs in direct mode and uses them only behind a configured proxy", async () => {
    expect(fs.readFileSync(new URL("../../docker-compose.yml", import.meta.url), "utf8")).toContain(
      "TRUST_PROXY:-0",
    );
    for (const trustProxy of [0, 1]) {
      const { container } = buildTestApp({ envOverrides: { TRUST_PROXY: String(trustProxy) } });
      const addresses = [];
      container.apiRateLimiter = (req, _res, next) => {
        addresses.push(req.ip);
        next();
      };
      const app = createApp(container);
      await request(app).get("/api/v1/health").set("X-Forwarded-For", "198.51.100.10");
      expect(addresses[0] === "198.51.100.10").toBe(trustProxy === 1);
    }
  });
});
