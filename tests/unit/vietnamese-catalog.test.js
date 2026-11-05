import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeCatalogName,
  translationCandidates,
  translationKey,
  validateTranslation,
} from "../../scripts/lib/vietnamese-catalog.js";
import { stableVariantId } from "../../scripts/seed-recipe-variants.js";

describe("Vietnamese catalog seed", () => {
  it("contains every translated food, recipe and variant in the current database seed scope", () => {
    const catalog = JSON.parse(
      fs.readFileSync("scripts/catalog-data/vietnamese-catalog-translations.json", "utf8"),
    );
    const entries = Object.entries(catalog.translations);
    expect(entries.filter(([key]) => key.startsWith("food:"))).toHaveLength(2349);
    expect(entries.filter(([key]) => key.startsWith("recipe:"))).toHaveLength(156);
    expect(entries.filter(([key]) => key.startsWith("variant:"))).toHaveLength(60);
    expect(entries.every(([, value]) => normalizeCatalogName(value.vi))).toBe(true);
    expect(Math.max(...entries.map(([, value]) => value.vi.length))).toBeLessThanOrEqual(200);
  });

  it("uses stable keys and resumes only missing or changed source records", () => {
    const foods = [{ slug: "sweet-potato", name: "Sweet potato" }];
    const recipes = [
      {
        slug: "soup",
        title: "Soup",
        variants: [{ variantId: "north", name: "Northern style" }],
      },
    ];
    const translations = {
      [translationKey.food(foods[0])]: {
        original: "Sweet potato",
        vi: "Khoai lang",
      },
    };
    expect(translationCandidates(foods, recipes, translations).map((item) => item.key)).toEqual([
      "recipe:soup",
      "variant:soup:north",
    ]);
  });

  it("accepts Vietnamese names without distinctive diacritics and rejects empty output", () => {
    const candidate = { key: "food:sweet-potato", original: "Sweet potato" };
    expect(validateTranslation(candidate, "  Khoai   lang ")).toBe("Khoai lang");
    expect(() => validateTranslation(candidate, " ")).toThrow("Translation is empty");
  });

  it("creates stable, distinct regional variant identifiers", () => {
    expect(stableVariantId("pho-chay", "vn")).toBe(stableVariantId("pho-chay", "vn"));
    expect(stableVariantId("pho-chay", "vn")).not.toBe(stableVariantId("pho-chay", "med"));
    expect(stableVariantId("pho-chay", "vn")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
