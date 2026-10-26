import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("YouTube background player waits for both iframe and API readiness", async () => {
  const source = await readFile(
    new URL("../src/components/games/FeaturedHero.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /function supportsPermissionPolicyFeature\(feature\)/);
  assert.match(source, /supportsPermissionPolicyFeature\("autoplay"\)/);
  assert.doesNotMatch(source, /iframe\.allow\s*=\s*["']autoplay;\s*encrypted-media/);
  assert.match(source, /iframe\.addEventListener\("load", onIframeLoad, \{ once: true \}\)/);
  assert.match(source, /!apiReady\s*\|\|\s*!iframeLoaded\s*\|\|\s*playerCreated/);
  assert.match(source, /origin: window\.location\.origin/);
});

test("RealtimeBridge does not reconnect on language changes or handle stale sockets", async () => {
  const source = await readFile(
    new URL("../src/services/RealtimeBridge.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /const pushRef = useRef\(push\)/);
  assert.match(source, /const tRef = useRef\(t\)/);
  assert.match(source, /\}, \[status, user\?\.id\]\);/);
  assert.match(source, /const connection = new WebSocket\(apiUrl\.toString\(\)\)/);
  assert.match(source, /if \(socket !== connection\) return;/);
  assert.match(source, /if \(socket === connection\) connection\.close\(\)/);
});
