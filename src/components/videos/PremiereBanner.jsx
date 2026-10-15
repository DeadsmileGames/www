import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useContent } from "../../hooks/useContent";
import { safeImageUrl } from "../../utils/urls";
import { VideoOverlay } from "./VideoOverlay";

const DAY = 24 * 60 * 60 * 1000;
const fallbackImage = "/assets/games/screenshots/light/1.png";

function countdown(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  return days > 0 ? `${days}d ${time}` : time;
}

export function PremiereBanner() {
  const { t } = useLanguage();
  const videos = useContent("/videos", { limit: 50 });
  const [now, setNow] = useState(Date.now());
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const premiere = (Array.isArray(videos.data) ? videos.data : []).find((video) => {
    if (!video.is_premiere || !video.premiere_at) return false;
    const scheduled = Date.parse(video.premiere_at);
    if (!Number.isFinite(scheduled)) return false;
    const delta = scheduled - now;
    const startedAt = Date.parse(video.actual_start_time || "");
    const recentlyStarted =
      video.broadcast_status === "live" ||
      (Number.isFinite(startedAt) && now >= startedAt && now - startedAt < DAY);
    return (delta > 0 && delta <= DAY) || (delta <= 0 && delta > -DAY && recentlyStarted);
  });

  if (!premiere) return null;

  const title = premiere.youtube_title || premiere.title;
  const scheduled = Date.parse(premiere.premiere_at);
  const live = scheduled <= now;
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(premiere.game_slug || "")
    ? premiere.game_slug
    : null;
  const screenshot = slug
    ? `/assets/games/screenshots/${slug}/1.png`
    : fallbackImage;
  const thumbnail = safeImageUrl(premiere.youtube_thumbnail || premiere.thumbnail);

  return (
    <>
      <button
        type="button"
        className="video-premiere-banner"
        onClick={() => setActiveVideo(premiere)}
        aria-label={live ? t("{0} is now playing", { 0: title }) : t("{0} will be available in", { 0: title })}
      >
        <img
          className="video-premiere-banner__image"
          src={screenshot}
          alt=""
          onError={(event) => {
            const image = event.currentTarget;
            if (!image.dataset.fallback && thumbnail) {
              image.dataset.fallback = "thumbnail";
              image.src = thumbnail;
            } else if (image.dataset.fallback !== "local") {
              image.dataset.fallback = "local";
              image.src = fallbackImage;
            } else {
              image.onerror = null;
            }
          }}
        />
        <span className="video-premiere-banner__content">
          <span className="video-premiere-banner__eyebrow">
            {live ? t("Now playing") : t("Upcoming premiere")}
          </span>
          <strong>
            {live
              ? t("{0} is now playing", { 0: title })
              : t("{0} will be available in", { 0: title })}
          </strong>
          {!live && (
            <span className="video-premiere-banner__countdown" aria-live="off">
              {countdown(scheduled - now)}
            </span>
          )}
        </span>
      </button>
      <VideoOverlay video={activeVideo} onClose={() => setActiveVideo(null)} />
    </>
  );
}
