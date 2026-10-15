import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useContent } from "../../hooks/useContent";
import { safeImageUrl } from "../../utils/urls";
import { VideoOverlay } from "./VideoOverlay";

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
  const bannerRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => videos.retry(), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [videos.retry]);

  const premiere = videos.data?.premiere || null;
  const hasPremiere = Boolean(premiere);

  useLayoutEffect(() => {
    const node = bannerRef.current;
    const root = document.documentElement;
    if (!hasPremiere || !node) {
      document.body.classList.remove("has-video-premiere");
      root.style.removeProperty("--video-premiere-height");
      return undefined;
    }

    const updateHeight = () => {
      root.style.setProperty("--video-premiere-height", `${node.getBoundingClientRect().height}px`);
    };
    document.body.classList.add("has-video-premiere");
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.body.classList.remove("has-video-premiere");
      root.style.removeProperty("--video-premiere-height");
    };
  }, [hasPremiere]);

  if (!premiere) return null;

  const title = premiere.title;
  const scheduled = Date.parse(premiere.starts_at);
  const live = premiere.state === "live";
  const screenshot =
    safeImageUrl(premiere.screenshots?.[0]) ||
    safeImageUrl(premiere.thumbnail) ||
    fallbackImage;
  const thumbnail = safeImageUrl(premiere.thumbnail);

  return (
    <>
      <button
        type="button"
        ref={bannerRef}
        className="rs-hero video-premiere"
        onClick={() => setActiveVideo(premiere)}
        aria-label={live ? t("{0} is now playing", { 0: title }) : t("{0} will be available in", { 0: title })}
      >
        <img
          className="game-hero__background video-premiere__image"
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
        <span className="rs-hero__overlay video-premiere__overlay" />
        <span className="rs-hero__actions video-premiere__content">
          <strong>
            {live
              ? t("{0} is now playing", { 0: title })
              : t("{0} will be available in", { 0: title })}
          </strong>
          {!live && (
            <span className="video-premiere__countdown" aria-live="off">
              {countdown(scheduled - now)}
            </span>
          )}
        </span>
      </button>
      <VideoOverlay video={activeVideo} onClose={() => setActiveVideo(null)} />
    </>
  );
}
