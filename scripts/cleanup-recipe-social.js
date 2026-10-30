import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { cleanupRecipeSocialArtifacts } from "./cleanup-recipe-social-core.js";

export async function main(args = process.argv.slice(2)) {
  const unknown = args.filter((arg) => arg !== "--apply");
  if (unknown.length) throw new Error(`Unknown option: ${unknown.join(", ")}`);

  const apply = args.includes("--apply");
  const env = loadEnv();
  if (!env.database.uri) throw new Error("MONGODB_URI is required");

  const logger = createLogger(env);
  const connection = await connectDatabase({ ...env.database, logger });
  try {
    const result = await cleanupRecipeSocialArtifacts(connection.db, { apply });
    logger.info(result, apply ? "Recipe social cleanup applied" : "Recipe social cleanup preview");
    return result;
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
