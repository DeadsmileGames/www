import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { useOptionalContent, setOptionalContent } from "../../utils/consent";
import { safeHttpsUrl, safeImageUrl, safeYoutubeEmbedUrl } from "../../utils/urls";

const fallbackImage = "/assets/games/screenshots/light/1.png";

export function VideoOverlay({ video, onClose }) {
  const { t, language } = useLanguage();
  const optionalAllowed = useOptionalContent();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!video) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeRef.current?.();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus?.();
    };
  }, [video]);

  if (!video) return null;

  const title = video.youtube?.title || video.youtube_title || video.title || t("Videos");
  const description = video.youtube?.description || video.youtube_description || video.description || video.excerpt;
  const thumbnail = safeImageUrl(video.youtube?.thumbnail || video.youtube_thumbnail || video.thumbnail);
  const databaseScreenshot = safeImageUrl(video.screenshots?.[0]);
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(video.game_slug || "")
    ? video.game_slug
    : null;
  const background = databaseScreenshot || (slug
    ? `/assets/games/screenshots/${slug}/1.png`
    : thumbnail || fallbackImage);
  const embed = safeYoutubeEmbedUrl(video.video_url);
  const external = safeHttpsUrl(video.video_url);
  const publishedAt = video.youtube?.publishedAt || video.youtube_published_at || video.published_at;
  const publishedDate =
    publishedAt && Number.isFinite(Date.parse(publishedAt))
      ? new Date(publishedAt).toLocaleDateString(language, {
          dateStyle: "long",
          timeZone: "UTC",
        })
      : null;

  return createPortal(
    <div
      className="video-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-overlay-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="video-overlay__backdrop"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.94)), url("${background}")` }}
      />
      <div className="video-overlay__content" ref={panelRef} tabIndex={-1}>
        <button
          type="button"
          className="video-overlay__close"
          onClick={onClose}
          aria-label={t("Close video")}
        >
          <X size={24} weight="bold" />
        </button>
        <div className="video-overlay__player">
          {embed && optionalAllowed ? (
            <iframe
              src={`${embed}?autoplay=1&mute=1&playsinline=1&rel=0`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : embed ? (
            <div className="video-overlay__consent support-card">
              {thumbnail && <img src={thumbnail} alt="" />}
              <p>{t("Allow YouTube content to play this video.")}</p>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setOptionalContent(true)}
              >
                {t("Allow YouTube")}
              </button>
            </div>
          ) : external ? (
            <a className="btn btn--secondary" href={external} target="_blank" rel="noopener noreferrer">
              {t("Open video")}
            </a>
          ) : (
            <p>{t("Video unavailable.")}</p>
          )}
        </div>
        <div className="video-overlay__meta">
          <span className="eyebrow">{video.category || t("Videos")}</span>
          <h2 id="video-overlay-title">{title}</h2>
          {publishedDate && <time dateTime={publishedAt}>{publishedDate}</time>}
          {description && <p>{description}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
