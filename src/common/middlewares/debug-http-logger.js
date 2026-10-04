import { STATUS_CODES } from "node:http";
import { performance } from "node:perf_hooks";

/**
 * Debug HTTP logger: in ra console một "khối" đẹp gồm toàn bộ thông tin
 * request nhận vào (method, url, query, params, headers, body, auth)
 * và response trả về (status, thời gian xử lý, kích thước, headers, body, lỗi gốc).
 *
 * Chỉ dùng cho môi trường dev (LOG_LEVEL=debug|trace). Các giá trị nhạy cảm
 * (token, password, cookie...) được che bớt để log vẫn an toàn khi chia sẻ.
 */

const DEFAULTS = {
  maxStringLength: 500, // cắt chuỗi quá dài (vd. base64, presigned url)
  maxArrayItems: 20, // chỉ hiển thị N phần tử đầu của mảng
  maxDepth: 8,
  maxBodyLines: 200, // tổng số dòng tối đa cho mỗi body
  width: 100,
  skipPaths: [/^\/api-docs/, /^\/favicon\.ico$/],
};

const SENSITIVE_KEY =
  /pass(word)?|secret|token|api[-_]?key|private[-_]?key|authorization|cookie|credential/i;

// Header bảo mật do helmet thêm vào — gần như không đổi, ẩn đi cho gọn.
const NOISY_RESPONSE_HEADERS = new Set([
  "content-security-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
  "cross-origin-embedder-policy",
  "origin-agent-cluster",
  "referrer-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-dns-prefetch-control",
  "x-download-options",
  "x-frame-options",
  "x-permitted-cross-domain-policies",
  "x-xss-protection",
  "vary",
]);

// ─── Màu sắc ────────────────────────────────────────────────────────────────
const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : String(text));
const color = {
  dim: paint("2"),
  bold: paint("1"),
  gray: paint("90"),
  red: paint("31"),
  green: paint("32"),
  yellow: paint("33"),
  blue: paint("34"),
  magenta: paint("35"),
  cyan: paint("36"),
  white: paint("97"),
  bgGreen: paint("1;30;42"),
  bgYellow: paint("1;30;43"),
  bgRed: paint("1;97;41"),
  bgBlue: paint("1;97;44"),
  bgCyan: paint("1;30;46"),
  bgMagenta: paint("1;97;45"),
  bgGray: paint("1;97;100"),
};

const METHOD_STYLE = {
  GET: color.bgBlue,
  POST: color.bgGreen,
  PUT: color.bgYellow,
  PATCH: color.bgCyan,
  DELETE: color.bgRed,
};

const statusStyle = (code) =>
  code >= 500
    ? color.bgRed
    : code >= 400
      ? color.bgYellow
      : code >= 300
        ? color.bgCyan
        : color.bgGreen;
const statusBorder = (code) =>
  code >= 500 ? color.red : code >= 400 ? color.yellow : code >= 300 ? color.cyan : color.green;

const highlightJson = (json) =>
  useColor
    ? json.replace(
        /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
          if (match.startsWith('"'))
            return match.endsWith(":") ? color.cyan(match) : color.green(match);
          if (match === "true" || match === "false") return color.yellow(match);
          if (match === "null") return color.gray(match);
          return color.magenta(match);
        },
      )
    : json;

// ─── Chuẩn hoá dữ liệu ──────────────────────────────────────────────────────
const maskValue = (value) => {
  if (value === undefined || value === null || value === "") return value;
  const text = String(value);
  if (text.length <= 12) return "******";
  return `${text.slice(0, 8)}…(masked ${text.length} chars)`;
};

const maskAuthorization = (value) => {
  if (typeof value !== "string") return value;
  const [scheme, token] = value.split(" ");
  return token ? `${scheme} ${maskValue(token)}` : maskValue(value);
};

const sanitize = (value, options, depth = 0) => {
  if (value === null || typeof value !== "object") {
    if (typeof value === "string" && value.length > options.maxStringLength)
      return `${value.slice(0, options.maxStringLength)}…(+${value.length - options.maxStringLength} chars)`;
    return value;
  }
  if (depth >= options.maxDepth) return Array.isArray(value) ? "[Array …]" : "[Object …]";
  if (Array.isArray(value)) {
    const items = value
      .slice(0, options.maxArrayItems)
      .map((item) => sanitize(item, options, depth + 1));
    if (value.length > options.maxArrayItems)
      items.push(`…(+${value.length - options.maxArrayItems} more items, total ${value.length})`);
    return items;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) && (typeof item === "string" || typeof item === "number")
        ? maskValue(item)
        : sanitize(item, options, depth + 1),
    ]),
  );
};

/** Đưa mọi kiểu dữ liệu (mongoose doc, ObjectId, Date, Buffer...) về dạng JSON thuần. */
const toPlain = (value) => {
  if (value === undefined) return undefined;
  if (Buffer.isBuffer(value)) {
    const text = value.toString("utf8");
    try {
      return JSON.parse(text);
    } catch {
      return `<Buffer ${value.length} bytes>`;
    }
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
};

const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (typeof value === "object" && Object.keys(value).length === 0);

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatDuration = (ms) => {
  const text = ms < 1000 ? `${ms.toFixed(1)} ms` : `${(ms / 1000).toFixed(2)} s`;
  return ms > 1000 ? color.red(text) : ms > 300 ? color.yellow(text) : color.green(text);
};

const time = () => {
  const d = new Date();
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

// ─── Dựng khối log ──────────────────────────────────────────────────────────
const createPrinter = (border, options) => {
  const lines = [];
  const bar = border("│");
  return {
    lines,
    top: () => lines.push(border(`┌${"─".repeat(options.width)}`)),
    bottom: () => lines.push(border(`└${"─".repeat(options.width)}`)),
    divider: () => lines.push(border(`├${"─".repeat(options.width)}`)),
    line: (text = "") => lines.push(`${bar} ${text}`),
    section: (title) => lines.push(`${border("├─")} ${color.bold(color.white(title))}`),
    keyValues: (object, { maskKey = () => false } = {}) => {
      const entries = Object.entries(object);
      const pad = Math.min(Math.max(...entries.map(([key]) => key.length)), 32);
      for (const [key, value] of entries) {
        const shown = maskKey(key)
          ? maskAuthorization(value)
          : Array.isArray(value)
            ? value.join(", ")
            : value;
        lines.push(`${bar}    ${color.cyan(key.padEnd(pad))} ${color.gray(":")} ${shown}`);
      }
    },
    json: (value) => {
      if (typeof value === "string") {
        const textLines = value.split("\n");
        textLines.slice(0, options.maxBodyLines).forEach((text) => lines.push(`${bar}    ${text}`));
        if (textLines.length > options.maxBodyLines)
          lines.push(
            `${bar}    ${color.gray(`…[+${textLines.length - options.maxBodyLines} lines]`)}`,
          );
        return;
      }
      const jsonLines = JSON.stringify(sanitize(value, options), null, 2)
        // Gộp mảng chỉ chứa giá trị nguyên thuỷ (số, chuỗi ngắn...) về 1 dòng cho gọn.
        .replace(/\[\n([^[\]{}]*?)\n\s*\]/g, (match, inner) => {
          const inline = `[${inner
            .split("\n")
            .map((item) => item.trim())
            .join(" ")}]`;
          return inline.length <= options.width ? inline : match;
        })
        .split("\n");
      jsonLines
        .slice(0, options.maxBodyLines)
        .forEach((text) => lines.push(`${bar}    ${highlightJson(text)}`));
      if (jsonLines.length > options.maxBodyLines)
        lines.push(
          `${bar}    ${color.gray(`…[+${jsonLines.length - options.maxBodyLines} lines truncated]`)}`,
        );
    },
  };
};

const buildBlock = ({ req, res, captured, startedAt, durationMs, aborted, options }) => {
  const status = res.statusCode;
  const border = aborted ? color.gray : statusBorder(status);
  const p = createPrinter(border, options);
  const method = req.method;
  const [path, rawQuery] = (req.originalUrl ?? req.url).split("?");

  // ── REQUEST ──
  p.top();
  p.line(
    `${color.bold("▶ REQUEST ")} ${(METHOD_STYLE[method] ?? color.bgMagenta)(` ${method} `)} ${color.bold(color.white(path))}${
      rawQuery ? color.gray(`?${decodeURIComponent(rawQuery)}`) : ""
    }`,
  );
  p.line(
    color.gray(
      `🕒 ${startedAt}   🆔 ${req.id ?? "-"}   🌐 ${req.ip ?? "-"}   📱 ${req.headers["user-agent"] ?? "-"}`,
    ),
  );

  const headers = { ...req.headers };
  delete headers["user-agent"];
  p.section("Headers");
  p.keyValues(headers, { maskKey: (key) => key === "authorization" || key === "cookie" });

  const query = toPlain(req.query);
  if (!isEmpty(query)) {
    p.section("Query");
    p.json(query);
  }
  if (!isEmpty(captured.params)) {
    p.section("Params");
    p.json(captured.params);
  }
  if (!isEmpty(req.body)) {
    p.section(`Body ${color.gray(`(${req.headers["content-type"] ?? "unknown"})`)}`);
    p.json(toPlain(req.body));
  } else if (!["GET", "HEAD", "OPTIONS", "DELETE"].includes(method)) {
    p.section(`Body ${color.gray("(empty)")}`);
  }
  if (req.auth) {
    const { firebaseUid, uid, email, userId, role, status: accountStatus } = req.auth;
    p.section("Auth");
    p.keyValues(
      Object.fromEntries(
        Object.entries({
          userId,
          role,
          email,
          firebaseUid: firebaseUid ?? uid,
          status: accountStatus,
        }).filter(([, value]) => value !== undefined),
      ),
    );
  }

  // ── RESPONSE ──
  p.divider();
  const statusLabel = aborted
    ? color.bgGray(" ABORTED ")
    : statusStyle(status)(` ${status} ${STATUS_CODES[status] ?? ""} `);
  const responsePlain = toPlain(captured.body);
  const size =
    Number(res.getHeader("content-length")) ||
    (captured.body === undefined
      ? 0
      : Buffer.byteLength(
          Buffer.isBuffer(captured.body)
            ? captured.body
            : typeof captured.body === "string"
              ? captured.body
              : (JSON.stringify(captured.body) ?? ""),
        ));
  p.line(
    `${color.bold("◀ RESPONSE")} ${statusLabel}   ⏱  ${formatDuration(durationMs)}   📦 ${color.white(formatBytes(size))}`,
  );

  const responseHeaders = Object.fromEntries(
    Object.entries(res.getHeaders()).filter(([key]) => !NOISY_RESPONSE_HEADERS.has(key)),
  );
  if (!isEmpty(responseHeaders)) {
    p.section("Headers");
    p.keyValues(responseHeaders, { maskKey: (key) => key === "set-cookie" });
  }

  if (captured.body !== undefined && captured.body !== "") {
    p.section("Body");
    p.json(responsePlain);
  } else {
    p.section(`Body ${color.gray("(empty)")}`);
  }

  const error = res.locals?.debugError;
  if (error) {
    p.section(color.red("Error (original, server-side only)"));
    p.line(color.red(`${error.name ?? "Error"}: ${error.message ?? String(error)}`));
    if (error.code !== undefined) p.line(color.red(`code: ${error.code}`));
    const stack = String(error.stack ?? "")
      .split("\n")
      .slice(1, 15)
      .map((text) => text.trim());
    stack.forEach((text) =>
      p.line(
        text.includes("node_modules") || text.includes("node:")
          ? color.gray(`  ${text}`)
          : color.yellow(`  ${text}`),
      ),
    );
    if (error.cause) p.line(color.red(`cause: ${error.cause?.message ?? String(error.cause)}`));
  }
  p.bottom();
  return p.lines.join("\n");
};

/**
 * @param {{ write?: (text: string) => void } & Partial<typeof DEFAULTS>} [config]
 */
export const createDebugHttpLogger = (config = {}) => {
  const { write = (text) => process.stdout.write(`${text}\n`), ...rest } = config;
  const options = { ...DEFAULTS, ...rest };

  return (req, res, next) => {
    if (options.skipPaths.some((pattern) => pattern.test(req.path))) return next();

    const start = performance.now();
    const startedAt = time();
    const captured = { body: undefined, params: undefined };

    // Bắt body trả về. res.json() gọi lại res.send() nên chỉ lưu lần đầu tiên.
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    res.json = (body) => {
      if (captured.body === undefined) captured.body = body;
      captured.params ??= { ...req.params };
      return originalJson(body);
    };
    res.send = (body) => {
      if (captured.body === undefined) captured.body = body;
      captured.params ??= { ...req.params };
      return originalSend(body);
    };

    let printed = false;
    const print = (aborted) => {
      if (printed) return;
      printed = true;
      try {
        write(
          buildBlock({
            req,
            res,
            captured,
            startedAt,
            durationMs: performance.now() - start,
            aborted,
            options,
          }),
        );
      } catch (error) {
        write(`[debug-http-logger] failed to format log: ${error?.message}`);
      }
    };
    res.on("finish", () => print(false));
    res.on("close", () => print(!res.writableFinished));
    next();
  };
};

/** Bật debug HTTP log khi LOG_LEVEL là debug/trace, không phải production/test, và đang chạy trong Terminal (TTY). */
export const isDebugHttpLogEnabled = (env) =>
  ["debug", "trace"].includes(env.logLevel) &&
  !env.isProduction &&
  !env.isTest &&
  Boolean(process.stdout.isTTY);
