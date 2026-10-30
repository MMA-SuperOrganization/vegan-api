import { pathToFileURL } from "node:url";
import { loadEnv } from "../src/config/env.js";
import { createFirebaseAuth } from "../src/config/firebase.js";
import { createLogger } from "../src/config/logger.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { UsersModel } from "../src/modules/users/users.model.js";
import { provisionAdminAccount, validateAdminSeedConfig } from "./seed-admin-core.js";

export async function main() {
  const env = loadEnv();
  if (!env.firebase.enabled)
    throw new Error("Firebase Admin credentials are required to provision an admin login");
  if (!env.database.uri) throw new Error("MONGODB_URI is required to seed the admin account");
  validateAdminSeedConfig(env.seed);

  const logger = createLogger(env);
  await connectDatabase({ ...env.database, logger });
  try {
    const result = await provisionAdminAccount({
      firebaseAuth: createFirebaseAuth(env.firebase),
      seed: env.seed,
      users: {
        findOne: (filter) => UsersModel.findOne(filter).lean(),
        upsert: (filter, value) =>
          UsersModel.findOneAndUpdate(
            filter,
            { $set: value },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
          ).lean(),
      },
    });
    logger.info(
      { firebaseUid: result.firebaseUid, email: result.email },
      "Administrator login provisioned",
    );
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
