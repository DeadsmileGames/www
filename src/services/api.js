import { friendlyErrorMessage } from '../utils/friendlyErrors';

const DEFAULT_API_URL = import.meta.env.DEV
  ? `${window.location.origin}/api`
  : 'https://deadsmile.vercel.app/api';
const REQUEST_TIMEOUT_MS = 20_000;

function normalizeBaseUrl(value) {
  const raw = String(value || DEFAULT_API_URL).trim().replace(/\/+$/, '');
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('VITE_API_URL must be a valid absolute URL.');
  }
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('VITE_API_URL cannot contain credentials, query parameters, or fragments.');
  }
  if (import.meta.env.PROD && parsed.protocol !== 'https:') {
    throw new Error('VITE_API_URL must use HTTPS in production.');
  }
  if (!import.meta.env.PROD && parsed.protocol !== 'https:' && !(isLocal && parsed.protocol === 'http:')) {
    throw new Error('VITE_API_URL must use HTTPS, except for local development.');
  }
  return parsed.toString().replace(/\/$/, '');
}

const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);
export const API_BASE_URL = BASE_URL;
let csrfToken = null;
let csrfPromise = null;

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function parseResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('Something went wrong. Try again later.', res.status, 'INVALID_RESPONSE');
  }
}

function validatePath(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    throw new ApiError('Something went wrong. Try again later.', 0, 'INVALID_REQUEST_PATH');
  }
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError('The server took too long. Try again.', 0, 'REQUEST_TIMEOUT');
    }
    throw new ApiError('Could not connect. Check your internet.', 0, 'NETWORK_ERROR');
  } finally {
    window.clearTimeout(timer);
  }
}

async function getCsrfToken({ force = false } = {}) {
  if (csrfToken && !force) return csrfToken;
  if (csrfPromise && !force) return csrfPromise;
  csrfPromise = fetchWithTimeout(`${BASE_URL}/csrf`, { credentials: 'include' })
    .then(async (res) => {
      const payload = await parseResponse(res);
      if (!res.ok || !payload?.data?.token) {
        throw new ApiError('Refresh the page and try again.', res.status, 'CSRF_INIT_FAILED');
      }
      csrfToken = payload.data.token;
      return csrfToken;
    })
    .catch((error) => {
      csrfToken = null;
      if (error instanceof ApiError) throw error;
      throw new ApiError('Could not connect. Check your internet.', 0, 'NETWORK_ERROR');
    })
    .finally(() => {
      csrfPromise = null;
    });
  return csrfPromise;
}

async function request(path, { method = 'GET', body, params, retryCsrf = true } = {}) {
  validatePath(path);
  let url = `${BASE_URL}${path}`;
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ).toString();
    if (query) url += `?${query}`;
  }
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers['X-CSRF-Token'] = await getCsrfToken();

  const res = await fetchWithTimeout(url, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await parseResponse(res);
  if (!res.ok) {
    const code = payload?.error?.code || 'UNKNOWN_ERROR';
    if (res.status === 403 && code === 'CSRF_VALIDATION_FAILED' && retryCsrf) {
      await getCsrfToken({ force: true });
      return request(path, { method, body, params, retryCsrf: false });
    }
    if (res.status === 401 && code === 'UNAUTHENTICATED') {
      csrfToken = null;
      window.dispatchEvent(new Event('deadsmile:auth-invalidated'));
    }
    throw new ApiError(
      friendlyErrorMessage({ code, status: res.status }, payload?.error?.message),
      res.status,
      code
    );
  }
  return payload?.data;
}

export const api = {
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path, body) => request(path, { method: 'DELETE', body }),
};

export { ApiError, friendlyErrorMessage };
