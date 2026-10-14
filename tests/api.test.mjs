import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const friendly = readFileSync(
  new URL("../src/utils/friendlyErrors.js", import.meta.url),
  "utf8",
)
  .replace(
    /import catalog from [^;]+;/,
    `const catalog = ${readFileSync(new URL("../src/generated/errors.json", import.meta.url), "utf8")};`,
  )
  .replaceAll("export function ", "function ");
const source = readFileSync(new URL("../src/services/api.js", import.meta.url), "utf8")
  .replace(/import \{ friendlyErrorMessage, errorLocale \} from [^;]+;/, friendly)
  .replaceAll("import.meta.env.DEV", "false")
  .replaceAll("import.meta.env.PROD", "true")
  .replaceAll("import.meta.env.VITE_API_URL", "undefined");
let sequence = 0;
async function client(handler) {
  globalThis.window = {
    location: { origin: "https://site.example.test" },
    setTimeout,
    clearTimeout,
    dispatchEvent() {},
  };
  globalThis.fetch = handler;
  return (
    await import(
      `data:text/javascript;base64,${Buffer.from(source + `\nconst testModuleIdentity = ${sequence++};`).toString("base64")}`
    )
  ).api;
}
function response(data, status = 200) {
  return new Response(JSON.stringify({ success: status < 400, ...data }), { status });
}

test("newsletter uses CSRF, credentials and the API response envelope", async () => {
  const requests = [];
  const api = await client(async (url, options) => {
    requests.push({ url, ...options });
    return response({
      data: url.endsWith("/csrf") ? { token: "test-csrf" } : { received: true },
    });
  });
  assert.deepEqual(await api.post("/newsletter", { email: "player@example.test" }), {
    received: true,
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].headers["X-CSRF-Token"], "test-csrf");
  assert.equal(requests[1].credentials, "include");
  assert.equal(JSON.parse(requests[1].body).email, "player@example.test");
});

test("a stale unauthenticated request cannot invalidate a newer completed two-factor login", async () => {
  let finishMe;
  let invalidations = 0;
  const api = await client(async (url) => {
    if (url.endsWith("/auth/me"))
      return new Promise((resolve) => {
        finishMe = resolve;
      });
    if (url.endsWith("/csrf")) return response({ data: { token: "csrf-token" } });
    return response({ data: { id: "account-id", username: "player" } });
  });
  window.dispatchEvent = () => {
    invalidations++;
  };
  const previous = api.get("/auth/me");
  await api.post("/auth/verify-2fa", { token: "123456" });
  finishMe(response({ error: { code: "UNAUTHENTICATED" } }, 401));
  await assert.rejects(previous, (failure) => failure.code === "UNAUTHENTICATED");
  assert.equal(invalidations, 0);
});
test("a rotated CSRF token is retried once, without losing the request body", async () => {
  let tokens = 0,
    writes = 0;
  const api = await client(async (url, options) => {
    if (url.endsWith("/csrf")) return response({ data: { token: `token-${++tokens}` } });
    writes++;
    if (writes === 1) return response({ error: { code: "CSRF_VALIDATION_FAILED" } }, 403);
    assert.equal(options.headers["X-CSRF-Token"], "token-2");
    assert.deepEqual(JSON.parse(options.body), { token: "newsletter-token" });
    return response({ data: { confirmed: true } });
  });
  assert.deepEqual(await api.post("/newsletter/confirm", { token: "newsletter-token" }), {
    confirmed: true,
  });
  assert.equal(writes, 2);
});
test("network errors and API validation errors remain actionable", async () => {
  let api = await client(async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(api.get("/games"), (error) => error.code === "NETWORK_ERROR");
  api = await client(async () =>
    response({ error: { message: "Video not found.", code: "VIDEO_NOT_FOUND" } }, 404),
  );
  await assert.rejects(
    api.get("/videos/missing"),
    (error) => error.message === "Video not found." && error.status === 404,
  );
});
test("external and protocol-relative API paths are rejected", async () => {
  const api = await client(async () => {
    assert.fail("Invalid path must never be fetched");
  });
  await assert.rejects(
    api.get("//other.example"),
    (error) => error.code === "INVALID_REQUEST_PATH",
  );
  await assert.rejects(
    api.get("https://other.example"),
    (error) => error.code === "INVALID_REQUEST_PATH",
  );
});

test("admin validation retains the API field messages without replacing them", async () => {
  const fields = [
    {
      name: "microsoftStoreBadge",
      code: "INVALID_STORE_BADGE",
      message: "Backend badge validation message",
    },
  ];
  const api = await client(async (url) =>
    url.endsWith("/csrf")
      ? response({ data: { token: "test-csrf" } })
      : response(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Backend validation message",
              fields,
            },
          },
          400,
        ),
  );
  await assert.rejects(api.post("/admin/game", { title: "Test" }), (error) => {
    assert.deepEqual(error.fields, fields);
    return (
      error.message === "Backend validation message" && error.code === "VALIDATION_ERROR"
    );
  });
});

test("requested language reaches the API and offline errors use the same backend catalog", async () => {
  globalThis.localStorage = { getItem: () => "pt-BR" };
  let api = await client(async (url, options) => {
    assert.equal(options.headers["Accept-Language"], "pt-BR");
    return response({ data: [] });
  });
  await api.get("/games");
  api = await client(async () => {
    throw new TypeError("private path must not leak");
  });
  await assert.rejects(api.get("/games"), (error) =>
    error.message.startsWith("Não foi possível conectar"),
  );
  delete globalThis.localStorage;
});

test("successful responses with an invalid API envelope fail safely", async () => {
  for (const payload of [null, {}, { success: false, data: [] }, { success: true }]) {
    const api = await client(
      async () => new Response(JSON.stringify(payload), { status: 200 }),
    );
    await assert.rejects(
      api.get("/games"),
      (failure) => failure.code === "INVALID_RESPONSE",
    );
  }
});
test("dot segments, backslashes, control characters and fragments cannot escape the API base", async () => {
  const api = await client(async () => {
    assert.fail("Unsafe path must never be fetched");
  });
  for (const path of [
    "/../account",
    "/%2e%2e/account",
    "/games/./account",
    "/\\evil.test",
    "/games#account",
    "/games\n",
  ]) {
    await assert.rejects(
      api.get(path),
      (failure) => failure.code === "INVALID_REQUEST_PATH",
      path,
    );
  }
});
test("parallel writes share one CSRF initialization", async () => {
  let csrf = 0;
  const api = await client(async (url) => {
    if (url.endsWith("/csrf")) {
      csrf++;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return response({ data: { token: "csrf-token" } });
    }
    return response({ data: { accepted: true } });
  });
  const results = await Promise.all([
    api.post("/newsletter", { email: "player@example.test" }),
    api.post("/support", { name: "player" }),
  ]);
  assert.equal(csrf, 1);
  assert(results.every((item) => item.accepted));
});
