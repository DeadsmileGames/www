import test from "node:test";
import assert from "node:assert/strict";
import { getVideoThumbnail } from "../src/utils/videoThumbnail.js";

test("external video thumbnails are withheld until optional content is allowed", () => {
  const video = {
    thumbnail_en: "https://i.ytimg.com/vi/abc123xyz/0.jpg",
    thumbnail: "https://cdn.example.test/video.webp",
  };

  assert.equal(getVideoThumbnail(video, "en", false), null);
  assert.equal(
    getVideoThumbnail(video, "en", true),
    "https://i.ytimg.com/vi/abc123xyz/0.jpg",
  );
});

test("local thumbnails remain available before optional content consent", () => {
  const video = {
    thumbnail_en: "https://cdn.example.test/video.webp",
    thumbnail: "/assets/games/screenshots/light/1.png",
  };

  assert.equal(
    getVideoThumbnail(video, "en", false),
    "/assets/games/screenshots/light/1.png",
  );
});

test("withheld external thumbnail falls back to local image data", () => {
  const video = {
    thumbnail_en: "https://cdn.example.test/video.webp",
    image: "/assets/games/screenshots/light/1.png",
  };

  assert.equal(
    getVideoThumbnail(video, "en", false),
    "/assets/games/screenshots/light/1.png",
  );
});
