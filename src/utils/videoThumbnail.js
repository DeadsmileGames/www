import { safeImageUrl } from "./urls.js";
import { optionalContentAllowed } from "./consent.js";

const localizedThumbnailFields = {
  en: "thumbnail_en",
  "pt-BR": "thumbnail_pt_br",
  es: "thumbnail_es",
};

function isExternalMediaUrl(value) {
  if (typeof value === "string" && value.startsWith("data:image/")) return false;
  try {
    const origin = typeof window !== "undefined"
      ? window.location.origin
      : "https://deadsmile.invalid";
    return new URL(value, origin).origin !== origin;
  } catch {
    return false;
  }
}

export function getVideoThumbnail(
  video,
  language = "en",
  allowExternalMedia = optionalContentAllowed(),
) {
  const localizedField = localizedThumbnailFields[language];
  const candidates = [
    localizedField ? video?.[localizedField] : null,
    video?.youtube?.thumbnail,
    video?.thumbnail,
    video?.image,
  ];

  for (const candidate of candidates) {
    const image = safeImageUrl(candidate);
    if (!image) continue;
    if (!allowExternalMedia && isExternalMediaUrl(image)) continue;
    return image;
  }

  return null;
}
