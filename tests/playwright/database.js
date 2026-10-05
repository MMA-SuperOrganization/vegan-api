import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { test } from "@playwright/test";
import { validateDatabaseTestConfig } from "../helpers/database-safety.js";

export async function database(h) {
  const config = validateDatabaseTestConfig();
  test.skip(
    !config.enabled,
    "Blocked: RUN_DATABASE_TESTS=true and a dedicated replica-set MONGODB_URI_TEST are required",
  );
  const dbName = `${config.database.slice(0, 45)}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const connection = await mongoose
    .createConnection(config.uri, {
      dbName,
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
      monitorCommands: true,
    })
    .asPromise();
  const models = Object.fromEntries(
    Object.entries(h.container.models).map(([key, model]) => [
      key,
      connection.model(model.modelName, model.schema, model.collection.name),
    ]),
  );
  try {
    const hello = await connection.db.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== "isdbgrid") throw new Error("A replica set is required");
    for (const model of new Set(Object.values(models))) {
      await model.createCollection();
      await model.createIndexes();
    }
  } catch (error) {
    await connection.close();
    throw error;
  }
  return {
    connection,
    models,
    dbName,
    config,
    async close() {
      // This UUID database was created by this helper; it cannot name an existing application DB.
      if (connection.name !== dbName || !dbName.startsWith("test_vegan_"))
        throw new Error("Refusing cleanup outside this run's database");
      await connection.dropDatabase();
      await connection.close();
    },
  };
}
