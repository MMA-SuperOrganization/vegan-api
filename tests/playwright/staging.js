import { test } from "@playwright/test";

// Explicit isolated staging opt-in. Never reuse the application's .env credentials.
export async function staging(playwright, required = []) {
  const missing = ["PW_STAGING_URL", "PW_STAGING_ISOLATED", ...required].filter(
    (key) => !process.env[key],
  );
  test.skip(
    missing.length > 0,
    `Blocked: missing ${missing.join(", ")}; this case needs real staging providers`,
  );
  if (process.env.PW_STAGING_ISOLATED !== "true")
    throw new Error("PW_STAGING_ISOLATED must be true for a disposable QA environment");
  const base = new URL(process.env.PW_STAGING_URL);
  if (base.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(base.hostname))
    throw new Error("Remote staging must use HTTPS");
  const http = await playwright.request.newContext({ baseURL: base.origin });
  const prefix = base.pathname.replace(/\/$/, "") || "/api/v1";
  return {
    http,
    prefix,
    async close() {
      await http.dispose();
    },
    async call(method, path, { token = process.env.PW_USER_TOKEN, body, query = {} } = {}) {
      const response = await http.fetch(`${prefix}${path}`, {
        method,
        params: query,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        ...(body !== undefined ? { data: body } : {}),
      });
      const json = await response.json();
      return { status: response.status(), response, body: json, data: json.data };
    },
  };
}
