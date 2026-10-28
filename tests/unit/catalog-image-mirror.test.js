import { describe, expect, it } from "vitest";

import {
  catalogImageDigest,
  catalogImageObjectKey,
  imageExtension,
  isExternalCatalogImage,
  parseCatalogImageMirrorArgs,
  runWithConcurrency,
} from "../../scripts/lib/catalog-image-mirror.js";

describe("catalog image mirror", () => {
  it("parses a safe preview by default and validates write options", () => {
    expect(parseCatalogImageMirrorArgs()).toEqual({
      apply: false,
      uploadOnly: false,
      concurrency: 4,
      limit: null,
    });
    expect(parseCatalogImageMirrorArgs(["--apply", "--concurrency", "2", "--limit", "10"])).toEqual(
      { apply: true, uploadOnly: false, concurrency: 2, limit: 10 },
    );
    expect(parseCatalogImageMirrorArgs(["--upload-only"]).uploadOnly).toBe(true);
    expect(() => parseCatalogImageMirrorArgs(["--apply", "--upload-only"])).toThrow();
    expect(() => parseCatalogImageMirrorArgs(["--concurrency", "0"])).toThrow();
    expect(() => parseCatalogImageMirrorArgs(["--unknown"])).toThrow();
  });

  it("selects only external HTTPS images", () => {
    const publicBase = "https://media.example.test";
    expect(isExternalCatalogImage("https://upload.wikimedia.org/a.jpg", publicBase)).toBe(true);
    expect(isExternalCatalogImage("https://upload.wikimedia.org/a.jpg")).toBe(true);
    expect(isExternalCatalogImage("https://media.example.test/catalog/a.jpg", publicBase)).toBe(
      false,
    );
    expect(isExternalCatalogImage("http://example.test/a.jpg", publicBase)).toBe(false);
    expect(isExternalCatalogImage("not-a-url", publicBase)).toBe(false);
  });

  it("creates deterministic content-addressed R2 keys", () => {
    const first = catalogImageObjectKey("https://example.test/a", "image/jpeg");
    const second = catalogImageObjectKey("https://example.test/a", "image/jpeg");
    expect(first).toBe(second);
    expect(first).toContain(catalogImageDigest("https://example.test/a"));
    expect(first).toMatch(/^catalog\/images\/[a-f0-9]{64}\.jpg$/);
    expect(imageExtension("image/webp; charset=binary")).toBe("webp");
    expect(() => catalogImageObjectKey("https://example.test/a", "text/html")).toThrow();
  });

  it("preserves result order while limiting parallel work", async () => {
    const active = { current: 0, maximum: 0 };
    const results = await runWithConcurrency([1, 2, 3, 4], 2, async (value) => {
      active.current += 1;
      active.maximum = Math.max(active.maximum, active.current);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active.current -= 1;
      return value * 2;
    });
    expect(results).toEqual([2, 4, 6, 8]);
    expect(active.maximum).toBe(2);
  });
});
