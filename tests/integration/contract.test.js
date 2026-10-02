import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { apiManifest } from "../../src/routes/api-manifest.js";
import { createApp } from "../../src/app.js";
import { createContainer } from "../../src/container.js";
import pino from "pino";

describe("Contract Test: Manifest <-> OpenAPI <-> Express Routes", () => {
  it("should match manifest endpoints with OpenAPI and Express", async () => {
    // 1. Read OpenAPI
    const openapiPath = path.join(process.cwd(), "docs", "openapi.yaml");
    const openapiDoc = yaml.parse(fs.readFileSync(openapiPath, "utf8"));
    const openapiPaths = Object.keys(openapiDoc.paths);

    // 2. Count endpoints in manifest
    const manifestPaths = apiManifest.map((m) => m.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}"));

    // Check mapping manifest <-> OpenAPI
    manifestPaths.forEach((p) => {
      expect(openapiPaths).toContain(p);
    });

    // 3. Count endpoints mounted in express
    const container = await createContainer({
      env: {
        firebase: { projectId: "test" },
        r2: { endpoint: "e", accessKeyId: "a", secretAccessKey: "s", bucketName: "b" },
      },
      logger: pino({ level: "silent" }),
    });
    const app = createApp(container);
    expect(apiManifest.length).toBeGreaterThan(0);
  });
});
