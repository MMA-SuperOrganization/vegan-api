import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mongoose from "mongoose";
import { z } from "zod";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { createAiProvider } from "../src/providers/ai/ai.provider.js";
import {
  readTranslations,
  translationCandidates,
  validateTranslation,
  writeTranslations,
} from "./lib/vietnamese-catalog.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT = path.join(SCRIPT_DIR, "catalog-data/vietnamese-catalog-translations.json");
const BATCH_SIZE = Math.max(10, Math.min(100, Number(process.env.TRANSLATION_BATCH_SIZE) || 60));
const CONCURRENCY = Math.max(1, Math.min(4, Number(process.env.TRANSLATION_CONCURRENCY) || 3));

const responseSchema = z.object({
  translations: z.array(
    z.object({ key: z.string().min(1).max(300), vi: z.string().min(2).max(300) }),
  ),
});

const chunks = (items, size) => {
  const result = [];
  for (let index = 0; index < items.length; index += size)
    result.push(items.slice(index, index + size));
  return result;
};

async function loadCatalog(database) {
  return Promise.all([
    database
      .collection("fooditems")
      .find({ status: { $ne: "inactive" } })
      .project({ name: 1, slug: 1, foodGroup: 1, category: 1 })
      .sort({ slug: 1 })
      .toArray(),
    database
      .collection("recipes")
      .find({ status: { $ne: "deleted" }, deletedAt: null })
      .project({ title: 1, slug: 1, cuisine: 1, variants: 1 })
      .sort({ slug: 1 })
      .toArray(),
  ]);
}

async function translateBatch(ai, batch, batchNumber) {
  const result = await ai.generate({
    feature: "catalog_translation",
    maxTokens: 4096,
    timeoutMsOverride: 120000,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          instruction:
            "Translate every catalog name into natural, concise Vietnamese for a vegan cooking application. Preserve the exact food, cultivar, preparation state and scientific qualifiers. Translate raw/cooked/dried/frozen/canned and regional wording. Keep recognized proper names only when necessary, but add an accented Vietnamese category so every vi value contains Vietnamese diacritics. Recipe and variant names must sound natural. Return each input key exactly once; do not add, remove, merge, explain or reorder records.",
          records: batch,
        }),
      },
    ],
    schema: responseSchema,
    requestId: `catalog-translation-${batchNumber}`,
  });
  const byKey = new Map(result.data.translations.map((item) => [item.key, item.vi]));
  if (byKey.size !== batch.length)
    throw new Error(`Batch ${batchNumber} returned ${byKey.size}/${batch.length} unique records`);
  return batch.map((candidate) => ({
    ...candidate,
    vi: validateTranslation(candidate, byKey.get(candidate.key)),
  }));
}

export async function main() {
  const env = loadEnv();
  const logger = createLogger(env);
  const output = path.resolve(
    process.argv.find((arg) => arg.startsWith("--output="))?.slice(9) || DEFAULT_OUTPUT,
  );
  try {
    await connectDatabase({ ...env.database, logger });
    const [foods, recipes] = await loadCatalog(mongoose.connection.db);
    const catalog = await readTranslations(output);
    const pending = translationCandidates(foods, recipes, catalog.translations);
    const batches = chunks(pending, BATCH_SIZE);
    const ai = createAiProvider({ env, logger });
    console.log(
      JSON.stringify({
        foods: foods.length,
        recipes: recipes.length,
        pending: pending.length,
        batches: batches.length,
        output,
      }),
    );
    let cursor = 0;
    let checkpoint = Promise.resolve();
    const failures = [];
    const workers = Array.from({ length: Math.min(CONCURRENCY, batches.length) }, async () => {
      while (cursor < batches.length) {
        const batchNumber = cursor++;
        let translated;
        try {
          translated = await translateBatch(ai, batches[batchNumber], batchNumber + 1);
        } catch (error) {
          failures.push({ batch: batchNumber + 1, error });
          console.error(`Rejected batch ${batchNumber + 1}/${batches.length}: ${error.message}`);
          continue;
        }
        for (const item of translated)
          catalog.translations[item.key] = {
            type: item.type,
            original: item.original,
            vi: item.vi,
          };
        checkpoint = checkpoint.then(() => writeTranslations(output, catalog));
        await checkpoint;
        console.log(
          `Translated batch ${batchNumber + 1}/${batches.length} (${translated.length} records)`,
        );
      }
    });
    await Promise.all(workers);
    await checkpoint;
    if (failures.length)
      throw new AggregateError(
        failures.map((failure) => failure.error),
        `${failures.length} translation batch(es) were rejected; rerun to resume them`,
      );
    console.log(
      JSON.stringify(
        {
          translated: pending.length,
          totalDictionaryEntries: Object.keys(catalog.translations).length,
          output,
        },
        null,
        2,
      ),
    );
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
