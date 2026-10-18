import { friendlyErrorMessage, errorLocale } from "../utils/friendlyErrors";

const DEFAULT_API_URL = `${window.location.origin}/api`;
const REQUEST_TIMEOUT_MS = 20_000;

function normalizeBaseUrl(value) {
  const raw = String(value || DEFAULT_API_URL)
    .trim()
    .replace(/\/+$/, "");
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("VITE_API_URL must be a valid absolute URL.");
  }
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(
      "VITE_API_URL cannot contain credentials, query parameters, or fragments.",
    );
  }
  if (import.meta.env.PROD && parsed.protocol !== "https:") {
    throw new Error("VITE_API_URL must use HTTPS in production.");
  }
  if (
    !import.meta.env.PROD &&
    parsed.protocol !== "https:" &&
    !(isLocal && parsed.protocol === "http:")
  ) {
    throw new Error("VITE_API_URL must use HTTPS, except for local development.");
  }
  return parsed.toString().replace(/\/$/, "");
}

const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);
export const API_BASE_URL = BASE_URL;
let csrfToken = null;
let csrfPromise = null;
let csrfGeneration = 0;
let authGeneration = 0;

class ApiError extends Error {
  constructor(message, status, code, fields = []) {
    super(message || friendlyErrorMessage({ code }));
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = Array.isArray(fields) ? fields : [];
  }
}

async function parseResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(null, res.status, "INVALID_RESPONSE");
  }
}

function validatePath(path) {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\\u0000-\u0020#]/.test(path) ||
    /(?:^|\/)(?:\.|%2e){1,2}(?:\/|%2f|\?|$)/i.test(path)
  ) {
    throw new ApiError(null, 0, "INVALID_REQUEST_PATH");
  }
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ApiError(null, 0, "REQUEST_TIMEOUT");
    }
    throw new ApiError(null, 0, "NETWORK_ERROR");
  } finally {
    window.clearTimeout(timer);
  }
}

async function getCsrfToken({ force = false } = {}) {
  if (csrfToken && !force) return csrfToken;
  if (csrfPromise && !force) return csrfPromise;
  const generation = ++csrfGeneration;
  const pending = fetchWithTimeout(`${BASE_URL}/csrf`, {
    credentials: "include",
    headers: { "Accept-Language": errorLocale() },
  })
    .then(async (res) => {
      const payload = await parseResponse(res);
      if (
        !res.ok ||
        payload?.success !== true ||
        typeof payload?.data?.token !== "string" ||
        !payload.data.token ||
        payload.data.token.length > 256
      ) {
        throw new ApiError(null, res.status, "CSRF_INIT_FAILED");
      }
      if (generation === csrfGeneration) csrfToken = payload.data.token;
      return payload.data.token;
    })
    .catch((error) => {
      if (generation === csrfGeneration) csrfToken = null;
      if (error instanceof ApiError) throw error;
      throw new ApiError(null, 0, "NETWORK_ERROR");
    })
    .finally(() => {
      if (csrfPromise === pending) csrfPromise = null;
    });
  csrfPromise = pending;
  return pending;
}

async function executeRequest(path, { method = "GET", body, params, retryCsrf = true } = {}) {
  validatePath(path);
  const authMutation =
    method === "POST" &&
    /^\/auth\/(?:login|verify-2fa|register|logout)$/.test(
      path,
    );
  const generation = authMutation ? ++authGeneration : authGeneration;
  let url = `${BASE_URL}${path}`;
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    ).toString();
    if (query) url += `?${query}`;
  }
  const headers = { Accept: "application/json", "Accept-Language": errorLocale() };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (!["GET", "HEAD", "OPTIONS"].includes(method))
    headers["X-CSRF-Token"] = await getCsrfToken();

  const res = await fetchWithTimeout(url, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await parseResponse(res);
  if (!res.ok) {
    const code = payload?.error?.code || "UNKNOWN_ERROR";
    if (res.status === 403 && code === "CSRF_VALIDATION_FAILED" && retryCsrf) {
      await getCsrfToken({ force: true });
      return request(path, { method, body, params, retryCsrf: false });
    }
    if (
      res.status === 401 &&
      code === "UNAUTHENTICATED" &&
      generation === authGeneration
    ) {
      csrfToken = null;
      csrfGeneration++;
      window.dispatchEvent(new Event("deadsmile:auth-invalidated"));
    }
    throw new ApiError(
      payload?.error?.message || friendlyErrorMessage({ code, status: res.status }),
      res.status,
      code,
      payload?.error?.fields,
    );
  }
  if (payload?.success !== true || !Object.hasOwn(payload, "data")) {
    throw new ApiError(null, res.status, "INVALID_RESPONSE");
  }
  if (authMutation && generation === authGeneration) authGeneration++;
  const contentType = path.match(/^\/admin\/(game|newsletter|video)(?:\/|$)/)?.[1];
  if (contentType && method !== "GET") {
    const type = contentType === "newsletter" ? "news" : contentType;
    window.dispatchEvent(
      new CustomEvent("deadsmile:live", {
        detail: {
          event_type: `${type}.${method === "DELETE" ? "deleted" : "updated"}`,
          entity_id: payload?.data?.id,
          payload: {
            id: payload?.data?.id,
            slug: payload?.data?.slug || body?.slug || null,
          },
        },
      }),
    );
  }
  return payload?.data;
}

const PUBLIC_GET_CACHE_TTL_MS = 10_000;
const PUBLIC_GET_CACHE_LIMIT = 100;
const publicGetCache = new Map();
const publicGetRequests = new Map();
let publicGetCacheGeneration = 0;

function isCacheablePublicGet(path, method) {
  if (method !== "GET") return false;
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "games") {
    return (
      segments.length === 1 ||
      (segments.length === 2 && segments[1] !== "download") ||
      (segments.length === 3 && segments[2] === "latest")
    );
  }
  if (segments[0] === "newswire" || segments[0] === "news") {
    return segments.length === 1 || segments.length === 2;
  }
  if (segments[0] === "videos") return segments.length === 1 || segments.length === 2;
  return ["/downloads", "/products", "/soundtracks", "/search"].includes(path);
}
function publicGetKey(path, params) {
  const entries = Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  const query = new URLSearchParams(entries).toString();
  return `${errorLocale()}\\n${path}${query ? `?${query}` : ""}`;
}

function clearPublicGetCache() {
  publicGetCacheGeneration += 1;
  publicGetCache.clear();
  publicGetRequests.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("deadsmile:live", clearPublicGetCache);
  window.addEventListener("deadsmile:auth-invalidated", clearPublicGetCache);
}

async function request(path, options = {}) {
  const method = options?.method || "GET";
  if (!isCacheablePublicGet(path, method)) return executeRequest(path, options);

  const key = publicGetKey(path, options?.params);
  const now = Date.now();
  const cached = publicGetCache.get(key);
  if (cached && cached.expiresAt > now) return cached.data;
  if (cached) publicGetCache.delete(key);

  const existing = publicGetRequests.get(key);
  if (existing) return existing;

  const generation = publicGetCacheGeneration;
  const pending = executeRequest(path, options);
  publicGetRequests.set(key, pending);
  try {
    const data = await pending;
    if (generation === publicGetCacheGeneration) {
      if (publicGetCache.size >= PUBLIC_GET_CACHE_LIMIT) {
        publicGetCache.delete(publicGetCache.keys().next().value);
      }
      publicGetCache.set(key, {
        data,
        expiresAt: Date.now() + PUBLIC_GET_CACHE_TTL_MS,
      });
    }
    return data;
  } finally {
    if (publicGetRequests.get(key) === pending) publicGetRequests.delete(key);
  }
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path, body) => request(path, { method: "DELETE", body }),
};

export { ApiError, friendlyErrorMessage };
