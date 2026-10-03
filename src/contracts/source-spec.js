import fs from "node:fs";

export const sourceSpecUrl = new URL(
  "../../../AI_AGENT_PROMPT_BUILD_VEGAN_BE_A_TO_Z.md",
  import.meta.url,
);

// Independent baseline: never imports the route manifest, generated docs or registry.
// Only the endpoint tables in source chapters 11 and 13 define the required set.
export function readSourceEndpoints(source = fs.readFileSync(sourceSpecUrl, "utf8")) {
  let chapter;
  const endpoints = [];
  for (const line of source.split(/\r?\n/)) {
    const heading = line.match(/^## (\d+)\./);
    if (heading) chapter = Number(heading[1]);
    if (![11, 13].includes(chapter)) continue;
    const match = line.match(
      /^\| (GET|POST|PUT|PATCH|DELETE) \| `([^`]+)` \| ([^|]+) \| ([^|]+) \|$/,
    );
    if (!match) continue;
    const [, method, path, permission, summary] = match;
    const auth =
      permission.trim() === "Firebase token"
        ? "firebase"
        : permission.trim() === "admin"
          ? "admin"
          : permission.includes("optional auth") || permission.includes("public hoặc owner")
            ? "optional"
            : permission.trim() === "public"
              ? "public"
              : permission.includes("owner")
                ? "owner"
                : permission.trim() === "user/admin"
                  ? "user"
                  : null;
    if (!auth) throw new Error(`Unknown source permission: ${permission}`);
    endpoints.push({
      method,
      path,
      auth,
      permission: permission.trim(),
      summary: summary.trim(),
      chapter,
    });
  }
  const keys = endpoints.map(({ method, path }) => `${method} ${path}`);
  if (new Set(keys).size !== keys.length)
    throw new Error("Source contract has duplicate method/path pairs");
  if (!endpoints.length) throw new Error("Source chapters 11/13 have no endpoint tables");
  return endpoints;
}

// Guest-compatible optional authentication enables owner enrichments without
// strengthening the source's public access requirement.
export const optionalPublicEnrichments = new Set([
  "GET /search",
  "GET /ratings/:targetType/:targetId/summary",
]);
export function sourceAuth(endpoint) {
  return optionalPublicEnrichments.has(`${endpoint.method} ${endpoint.path}`)
    ? "optional"
    : endpoint.auth;
}
