import assert from "node:assert/strict";
import test from "node:test";
import { safeHttpsUrl, safeImageUrl, safeItchUrl, safeYoutubeEmbedUrl } from "../src/utils/urls.js";
import { formatReleaseDate, getReleaseTimestamp } from "../src/utils/releaseDate.js";

test("HTTPS URL validation normalizes valid URLs and rejects unsafe protocols", () => {
  assert.equal(safeHttpsUrl("https://example.com/path"), "https://example.com/path");
  assert.equal(safeHttpsUrl("http://example.com"), null);
  assert.equal(safeHttpsUrl("mailto:help@example.com"), null);
  assert.equal(safeHttpsUrl("https://user:password@example.com"), null);
  assert.equal(safeHttpsUrl("//example.com/path"), null);
  assert.equal(safeHttpsUrl(""), null);
});

test("itch.io URL validation accepts only the official domain and subdomains", () => {
  assert.equal(safeItchUrl("https://itch.io/game"), "https://itch.io/game");
  assert.equal(safeItchUrl("https://studio.itch.io/game"), "https://studio.itch.io/game");
  assert.equal(safeItchUrl("https://itch.io.example.org/game"), null);
  assert.equal(safeItchUrl("https://example.org/?next=itch.io"), null);
});

test("image URLs accept safe local paths and supported image data", () => {
  assert.equal(safeImageUrl("/assets/cover.webp"), "/assets/cover.webp");
  assert.equal(safeImageUrl("data:image/png;base64,AAAA"), "data:image/png;base64,AAAA");
  assert.equal(safeImageUrl("//attacker.example/cover.png"), null);
  assert.equal(safeImageUrl("/\\\\attacker.example/cover.png"), null);
  assert.equal(safeImageUrl("data:application/octet-stream;base64,AAAA"), null);
});

test("YouTube URLs are converted to the privacy-enhanced embed host", () => {
  assert.equal(safeYoutubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(safeYoutubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(safeYoutubeEmbedUrl("https://youtube.com.example.org/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(safeYoutubeEmbedUrl("https://youtube.com/watch?v=bad"), null);
});

test("date-only release timestamps use São Paulo midnight", () => {
  assert.equal(new Date(getReleaseTimestamp("2025-01-15")).toISOString(), "2025-01-15T03:00:00.000Z");
});

test("invalid calendar dates are rejected instead of normalized by Date.parse", () => {
  assert.equal(Number.isNaN(getReleaseTimestamp("2025-02-30")), true);
  assert.equal(formatReleaseDate("2025-02-30", "en-US"), null);
  assert.equal(formatReleaseDate("not a date", "en-US"), null);
});

test("date-only release formatting preserves the selected calendar day", () => {
  assert.equal(formatReleaseDate("2025-01-15", "en-US", { month: "long", day: "numeric", year: "numeric" }), "January 15, 2025");
});
