import { api } from "../services/api";

const titleCache = new Map();
const titleRequests = new Map();
const TITLE_CACHE_MS = 60 * 60 * 1_000;

export function normalizeWebLink(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  const candidate = /^www\./i.test(raw) ? `https://${raw}` : raw;

  try {
    const url = new URL(candidate);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) return null;
    return url;
  } catch {
    return null;
  }
}

function previewUrlFor(url) {
  const preview = new URL(url.href);
  if (preview.protocol === "http:") {
    preview.protocol = "https:";
    if (preview.port === "80") preview.port = "";
  }
  preview.hash = "";
  return preview.href;
}

export async function getExternalPageTitle(value) {
  const parsed = normalizeWebLink(value);
  if (!parsed) return null;

  const url = previewUrlFor(parsed);
  const cached = titleCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.title;
  if (cached) titleCache.delete(url);
  if (titleRequests.has(url)) return titleRequests.get(url);

  const request = api
    .get("/link-preview", { url })
    .then((result) => {
      const title =
        typeof result?.title === "string" && result.title.trim()
          ? result.title.trim()
          : null;
      titleCache.set(url, {
        title,
        expiresAt: Date.now() + TITLE_CACHE_MS,
      });
      return title;
    })
    .catch(() => {
      titleCache.set(url, {
        title: null,
        expiresAt: Date.now() + 5 * 60 * 1_000,
      });
      return null;
    })
    .finally(() => titleRequests.delete(url));

  titleRequests.set(url, request);
  return request;
}
