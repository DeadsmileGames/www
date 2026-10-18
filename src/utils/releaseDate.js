const GAME_RELEASE_TIME_ZONE = "America/Sao_Paulo";
const RELEASE_DATETIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: GAME_RELEASE_TIME_ZONE,
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit",
  minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

function hasCalendarDatePrefix(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}(?:$|[T\s])/.test(value.trim());
}
function calendarDateParts(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const check = new Date(0);
  check.setUTCFullYear(year, month - 1, day);
  check.setUTCHours(12, 0, 0, 0);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}
function calendarPartsAt(timestamp) {
  return Object.fromEntries(RELEASE_DATETIME_FORMATTER.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]));
}
export function getReleaseTimestamp(value) {
  if (!value) return Number.NaN;
  const date = calendarDateParts(value);
  if (!date) {
    if (hasCalendarDatePrefix(value)) return Number.NaN;
    return Date.parse(value);
  }
  const targetAsUtc = Date.UTC(date.year, date.month - 1, date.day);
  let timestamp = targetAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = calendarPartsAt(timestamp);
    const representedAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    const adjustment = targetAsUtc - representedAsUtc;
    timestamp += adjustment;
    if (adjustment === 0) break;
  }
  return timestamp;
}
export function formatReleaseDate(value, language, options = {}) {
  if (!value) return null;
  const date = calendarDateParts(value);
  if (!date) {
    if (hasCalendarDatePrefix(value)) return null;
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return null;
    return new Intl.DateTimeFormat(language, { ...options, timeZone: GAME_RELEASE_TIME_ZONE }).format(new Date(timestamp));
  }
  const middayUtc = new Date(Date.UTC(date.year, date.month - 1, date.day, 12));
  return new Intl.DateTimeFormat(language, { ...options, timeZone: "UTC" }).format(middayUtc);
}
