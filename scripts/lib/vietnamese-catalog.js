import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const hasVietnamese = (value) => /[ăâđêôơưĂÂĐÊÔƠƯà-ỹÀ-Ỹ]/u.test(String(value ?? ""));

export const normalizeCatalogName = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");

export const translationKey = {
  food: (food) => `food:${food.slug}`,
  recipe: (recipe) => `recipe:${recipe.slug}`,
  variant: (recipe, variant) => `variant:${recipe.slug}:${variant.variantId}`,
};

export async function readTranslations(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { version: 1, generatedAt: null, translations: {} };
  }
}

export async function writeTranslations(file, catalog) {
  const ordered = Object.fromEntries(
    Object.entries(catalog.translations ?? {}).sort(([left], [right]) => left.localeCompare(right)),
  );
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
  await fs.writeFile(
    temporary,
    `${JSON.stringify({ ...catalog, generatedAt: new Date().toISOString(), translations: ordered }, null, 2)}\n`,
    "utf8",
  );
  await fs.rename(temporary, file);
}

export function translationCandidates(foods, recipes, translations = {}) {
  const result = [];
  const add = (key, type, original, context) => {
    const normalized = normalizeCatalogName(original);
    const existing = translations[key];
    if (!normalized || hasVietnamese(normalized)) return;
    if (existing?.original === normalized && normalizeCatalogName(existing.vi)) return;
    result.push({ key, type, original: normalized, context });
  };
  for (const food of foods)
    add(translationKey.food(food), "ingredient", food.name, food.foodGroup ?? food.category);
  for (const recipe of recipes) {
    add(translationKey.recipe(recipe), "recipe", recipe.title, recipe.cuisine);
    for (const variant of recipe.variants ?? [])
      add(
        translationKey.variant(recipe, variant),
        "variant",
        variant.name,
        [recipe.title, variant.region].filter(Boolean).join(" | "),
      );
  }
  return result;
}

export function validateTranslation(candidate, value) {
  const vi = normalizeCatalogName(value);
  if (!vi) throw new Error(`Translation is empty for ${candidate.key}`);
  return vi;
}
