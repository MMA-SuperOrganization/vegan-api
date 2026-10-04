import { pathToFileURL } from "node:url";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { getApps, deleteApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { loadEnv } from "../src/config/env.js";
import { createFirebaseAuth } from "../src/config/firebase.js";
import { createR2Client } from "../src/config/r2.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";

export async function runPreflight(checks, { timeoutMs = 10000 } = {}) {
  const results = [];
  for (const [name, check] of Object.entries(checks)) {
    if (!check) {
      results.push({ name, status: "skipped" });
      continue;
    }
    const controller = new AbortController();
    let timer;
    try {
      await Promise.race([
        check(controller.signal),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("timeout"));
          }, timeoutMs);
        }),
      ]);
      results.push({ name, status: "verified" });
    } catch {
      results.push({ name, status: "failed" });
    } finally {
      clearTimeout(timer);
    }
  }
  return results;
}
export async function main({ fcmToken = process.env.STAGING_FCM_TOKEN } = {}) {
  const env = loadEnv();
  const logger = { info() {} };
  let r2;
  try {
    const report = await runPreflight({
      database: async () => {
        const connection = await connectDatabase({ ...env.database, autoIndex: false, logger });
        await connection.db.admin().command({ ping: 1 });
      },
      firebase: env.firebase.enabled
        ? async () => {
            await createFirebaseAuth(env.firebase).listUsers(1);
          }
        : null,
      r2: env.r2.enabled
        ? async (signal) => {
            r2 = createR2Client(env.r2);
            await r2.send(new HeadBucketCommand({ Bucket: env.r2.bucketName }), {
              abortSignal: signal,
            });
          }
        : null,
      aiModels: env.ai.enabled
        ? async (signal) => {
            const response = await fetch(`${env.ai.baseUrl.replace(/\/$/, "")}/models`, {
              signal,
              headers: { Authorization: `Bearer ${env.ai.apiKey}` },
            });
            if (!response.ok) throw new Error("AI models unavailable");
            const body = await response.json();
            if (
              ![env.ai.chatModel, env.ai.visionModel].every((model) =>
                body.data?.some((item) => item.id === model),
              )
            )
              throw new Error("Configured model unavailable");
          }
        : null,
      fcmDryRun:
        env.fcmEnabled && fcmToken
          ? async () => {
              createFirebaseAuth(env.firebase);
              await getMessaging(getApps().find((app) => app.name === "vegan-api")).send(
                { token: fcmToken, data: { preflight: "true" } },
                true,
              );
            }
          : null,
    });
    process.stdout.write(
      `${JSON.stringify({ checks: report, scope: "Read-only preflight; FCM uses dry-run. Upload/download, generation, and device delivery still need staging workflow tests." })}\n`,
    );
    if (report.some((check) => check.status === "failed")) process.exitCode = 1;
    return report;
  } finally {
    r2?.destroy();
    await disconnectDatabase();
    for (const app of getApps().filter((app) => app.name === "vegan-api")) await deleteApp(app);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    process.stderr.write("Preflight configuration failed; fill required environment values\n");
    process.exitCode = 1;
  });
