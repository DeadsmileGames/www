import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";

const baseUrl = "http://127.0.0.1:4179";
let server;
let serverOutput = "";

before(async () => {
  server = spawn(process.execPath, [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4179",
    "--strictPort",
  ], { stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.setEncoding("utf8");
  server.stderr.setEncoding("utf8");
  server.stdout.on("data", (chunk) => { serverOutput += chunk; });
  server.stderr.on("data", (chunk) => { serverOutput += chunk; });

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Vite preview exited before becoming ready.\n${serverOutput}`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  server.kill();
  throw new Error(`Vite preview did not start in time.\n${serverOutput}`);
});

after(() => {
  if (server && server.exitCode === null) server.kill();
});

test("production build serves the SPA shell for primary website routes", async () => {
  for (const route of ["/", "/games", "/videos", "/support"]) {
    const response = await fetch(new URL(route, baseUrl));
    assert.equal(response.status, 200, `${route} should return HTTP 200`);
    assert.match(response.headers.get("content-type") || "", /text\/html/i);
    assert.match(await response.text(), /<div id="root"><\/div>/);
  }
});
