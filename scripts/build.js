import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));

const runNode = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: "inherit",
      shell: false,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Node check failed (${signal ?? code}): ${args.join(" ")}`));
    });
  });

const collectJavaScript = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectJavaScript(filename)));
    else if (entry.isFile() && /\.(?:js|mjs|cjs)$/.test(entry.name)) files.push(filename);
  }
  return files.sort();
};

try {
  if (Number(process.versions.node.split(".")[0]) < 24)
    throw new Error(`Build requires Node.js 24 or newer; current runtime is ${process.version}.`);

  console.log(`Checking backend on ${process.version}...`);
  const files = [
    ...(await collectJavaScript(path.join(root, "src"))),
    ...(await collectJavaScript(path.join(root, "scripts"))),
  ];
  // Keep native parser checks bounded on Windows, Docker and CI runners.
  for (let offset = 0; offset < files.length; offset += 4) {
    const results = await Promise.allSettled(
      files.slice(offset, offset + 4).map((filename) => runNode(["--check", filename])),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
  }
  console.log(`Syntax PASS: ${files.length} JavaScript files.`);
  await runNode(["scripts/generate-docs.js", "--check"]);
  await runNode(["scripts/smoke.js"]);
  console.log("Build PASS: syntax, generated API documentation and offline startup smoke.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
