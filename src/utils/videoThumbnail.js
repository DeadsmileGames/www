import { safeImageUrl } from "./urls";

const localizedThumbnailFields = {
  en: "thumbnail_en",
  "pt-BR": "thumbnail_pt_br",
  es: "thumbnail_es",
};

export function getVideoThumbnail(video, language = "en") {
  const localizedField = localizedThumbnailFields[language];
  return (
    (localizedField ? safeImageUrl(video?.[localizedField]) : null) ||
    safeImageUrl(video?.youtube?.thumbnail) ||
    safeImageUrl(video?.thumbnail)
  );
}
