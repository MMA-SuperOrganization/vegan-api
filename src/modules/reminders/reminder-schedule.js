const formatters = new Map();
function localParts(value, timezone) {
  if (!formatters.has(timezone))
    formatters.set(
      timezone,
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }),
    );
  return Object.fromEntries(
    formatters
      .get(timezone)
      .formatToParts(new Date(value))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  );
}
function wallEpoch(p) {
  return Date.UTC(p.year, p.month - 1, p.day, p.hour ?? 0, p.minute ?? 0, p.second ?? 0);
}
/** Earlier occurrence on fall-back; shift forward by the gap on spring-forward. */
function resolveWallTime(target, timezone) {
  const wall = wallEpoch(target);
  const offsets = new Set();
  for (let hours = -36; hours <= 36; hours += 6) {
    const probe = wall + hours * 3600000;
    offsets.add(wallEpoch(localParts(probe, timezone)) - probe);
  }
  const candidates = [...offsets].map((offset) => wall - offset).sort((a, b) => a - b);
  const exact = candidates.filter((utc) => wallEpoch(localParts(utc, timezone)) === wall);
  if (exact.length) return exact[0];
  const shifted = candidates
    .map((utc) => ({ utc, delta: wallEpoch(localParts(utc, timezone)) - wall }))
    .filter((v) => v.delta > 0)
    .sort((a, b) => a.delta - b.delta);
  if (!shifted.length) throw new RangeError("Cannot resolve reminder local time");
  return shifted[0].utc;
}
export function nextReminderRun(schedule, after, { inclusive = false } = {}) {
  const afterMs = new Date(after).getTime();
  if (schedule.mode === "once") {
    const at = new Date(schedule.at).getTime();
    return at > afterMs || (inclusive && at === afterMs) ? new Date(at) : null;
  }
  const timezone = schedule.timezone || "UTC";
  const local = localParts(afterMs, timezone);
  const [hour, minute] = schedule.at.split(":").map(Number);
  const start = Date.UTC(local.year, local.month - 1, local.day);
  for (let day = 0; day <= 370; day++) {
    const date = new Date(start + day * 86400000);
    if (schedule.mode === "weekly" && !schedule.daysOfWeek.includes(date.getUTCDay())) continue;
    const utc = resolveWallTime(
      {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour,
        minute,
      },
      timezone,
    );
    if (utc > afterMs || (inclusive && utc === afterMs)) return new Date(utc);
  }
  throw new RangeError("No next reminder occurrence");
}
