const GAME_RELEASE_TIME_ZONE = "America/Sao_Paulo";
const RELEASE_DATETIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: GAME_RELEASE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function calendarDateParts(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(0);
  check.setUTCFullYear(year, month - 1, day);
  check.setUTCHours(12, 0, 0, 0);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function calendarPartsAt(timestamp) {
  return Object.fromEntries(
    RELEASE_DATETIME_FORMATTER
      .formatToParts(new Date(timestamp))
      .map(({ type, value }) => [type, value]),
  );
}

/**
 * Release dates are calendar dates, even when the API serializes a SQL DATE
 * as midnight UTC (for example, "2026-11-10T00:00:00.000Z"). Preserve the
 * YYYY-MM-DD portion instead of letting timezone conversion move it a day.
 */
export function getReleaseTimestamp(value) {
  if (!value) return Number.NaN;
  const date = calendarDateParts(value);
  if (!date) return Date.parse(value);

  const targetAsUtc = Date.UTC(date.year, date.month - 1, date.day);
  let timestamp = targetAsUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = calendarPartsAt(timestamp);
    const representedAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const adjustment = targetAsUtc - representedAsUtc;
    timestamp += adjustment;
    if (adjustment === 0) break;
  }

  return timestamp;
}

/**
 * Formats a release date from its stored calendar day, independent of the
 * visitor's timezone and independent of whether the API appends a UTC time.
 */
export function formatReleaseDate(value, language, options = {}) {
  if (!value) return null;
  const date = calendarDateParts(value);

  if (date) {
    const middayUtc = new Date(Date.UTC(date.year, date.month - 1, date.day, 12));
    return new Intl.DateTimeFormat(language, {
      ...options,
      timeZone: "UTC",
    }).format(middayUtc);
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Intl.DateTimeFormat(language, {
    ...options,
    timeZone: GAME_RELEASE_TIME_ZONE,
  }).format(new Date(timestamp));
}
