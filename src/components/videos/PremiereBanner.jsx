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
  const videos = useContent("/videos/premiere");
  const [now, setNow] = useState(Date.now());
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => videos.retry(), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [videos.retry]);

  const premiere = videos.data?.premiere || null;

  if (!premiere) return null;

  const title = premiere.title;
  const scheduled = Date.parse(premiere.starts_at);
  const live = premiere.state === "live" || scheduled <= now;
  const screenshot = safeImageUrl(premiere.screenshots?.[0]) || safeImageUrl(premiere.thumbnail) || fallbackImage;
  const thumbnail = safeImageUrl(premiere.thumbnail);

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
