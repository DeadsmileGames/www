import { useEffect, useState } from "react";
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
  const live = premiere.state === "live";
  const screenshot = safeImageUrl(premiere.screenshots?.[0]) || safeImageUrl(premiere.thumbnail) || fallbackImage;
  const thumbnail = safeImageUrl(premiere.thumbnail);

  return (
    <>
      <button
        type="button"
        className="rs-hero"
        style={{
          width: "100%",
          minHeight: 76,
          padding: "12px 24px",
          alignItems: "center",
          justifyContent: "center",
          border: 0,
          borderRadius: 0,
          color: "#fff",
          font: "inherit",
          textAlign: "center",
          cursor: "pointer",
          appearance: "none",
          backgroundColor: "#101010",
        }}
        onClick={() => setActiveVideo(premiere)}
        aria-label={live ? t("{0} is now playing", { 0: title }) : t("{0} will be available in", { 0: title })}
      >
        <img
          className="game-hero__background"
          style={{ zIndex: 0, opacity: 0.35, filter: "saturate(.7)" }}
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
        <span
          className="rs-hero__overlay"
          style={{
            zIndex: 1,
            background: "linear-gradient(90deg, rgba(0,0,0,.88), rgba(0,0,0,.56), rgba(0,0,0,.88))",
          }}
        />
        <span
          className="rs-hero__actions"
          style={{
            position: "relative",
            zIndex: 2,
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "8px 18px",
            maxWidth: 1200,
            padding: 0,
          }}
        >
          <strong style={{ fontSize: "clamp(14px, 1.3vw, 17px)", fontWeight: 600 }}>
            {live
              ? t("{0} is now playing", { 0: title })
              : t("{0} will be available in", { 0: title })}
          </strong>
          {!live && (
            <span
              className="news-page__date"
              aria-live="off"
              style={{ color: "#fff", fontVariantNumeric: "tabular-nums", fontSize: 15, fontWeight: 700, letterSpacing: ".08em" }}
            >
              {countdown(scheduled - now)}
            </span>
          )}
        </span>
      </button>
      <VideoOverlay video={activeVideo} onClose={() => setActiveVideo(null)} />
    </>
  );
}
