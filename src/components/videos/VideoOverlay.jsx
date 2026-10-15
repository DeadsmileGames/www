import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { useContent } from "../../hooks/useContent";
import { setOptionalContent, useOptionalContent } from "../../utils/consent";
import { trapFocus } from "../../utils/dom";
import { safeHttpsUrl, safeImageUrl, safeYoutubeEmbedUrl } from "../../utils/urls";

const fallbackImage = "/assets/games/screenshots/light/1.png";

function Panel({ videoId, background, onClose }) {
  const { t, language } = useLanguage();
  const allowed = useOptionalContent();
  const reducedMotion = useReducedMotion();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const resource = useContent(`/videos/${encodeURIComponent(videoId)}`);
  const video = resource.status === "success" ? resource.data : null;
  const embed = safeYoutubeEmbedUrl(video?.video_url);
  const playerLanguage = ["en", "es", "pt-BR"].includes(language) ? language : "en";
  const embedSrc = (() => {
    if (!embed) return null;
    const url = new URL(embed);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("rel", "0");
    // YouTube uses this locale for player UI and language preference hints.
    // Audio-track availability/selection itself is controlled by YouTube.
    url.searchParams.set("hl", playerLanguage);
    return url.toString();
  })();
  const external = safeHttpsUrl(video?.video_url);
  const gameSlug =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(video?.game_slug || "") ? video.game_slug : null;
  const image =
    safeImageUrl(background) ||
    safeImageUrl(video?.game_screenshot) ||
    safeImageUrl(video?.screenshots?.[0]) ||
    (gameSlug ? safeImageUrl(`/assets/games/screenshots/${gameSlug}/1.png`) : null) ||
    safeImageUrl(video?.thumbnail) ||
    fallbackImage;
  const released = video?.youtube?.publishedAt || video?.published_at;
  useEffect(() => trapFocus(panelRef.current, () => closeRef.current()), []);

  return (
    <motion.div
      className="video-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-overlay-title"
      tabIndex={-1}
      ref={panelRef}
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: reducedMotion ? 0.01 : 0.45, ease: "easeInOut" }}
    >
      {image && <img className="video-overlay__background" src={image} alt="" />}
      <button
        type="button"
        className="dialog-close"
        onClick={onClose}
        aria-label={t("Close video")}
      >
        <X weight="bold" />
      </button>
      <div className="video-overlay__content">
        {resource.status === "loading" && <p className="content-state">{t("Loading")}</p>}
        {resource.status === "error" && (
          <div className="content-state" role="alert">
            <p>{resource.error}</p>
            <button type="button" className="btn btn--secondary" onClick={resource.retry}>
              {t("Try again")}
            </button>
          </div>
        )}
        {video && (
          <>
            <div className="video-dialog video-overlay__player">
              {embed && !allowed ? (
                <div className="support-card">
                  <p>{t("Allow YouTube content to play this video.")}</p>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setOptionalContent(true)}
                  >
                    {t("Allow YouTube")}
                  </button>
                </div>
              ) : embed ? (
                <iframe
                  src={embedSrc}
                  title={video.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : external ? (
                <a className="btn" href={external} target="_blank" rel="noopener noreferrer">
                  {t("Open video")}
                </a>
              ) : (
                <p>{t("No video source available.")}</p>
              )}
            </div>
            <div className="video-overlay__details">
              <div>
                <h2 id="video-overlay-title">{video.youtube?.title || video.title}</h2>
                {released && Number.isFinite(Date.parse(released)) && (
                  <small>
                    {new Date(released).toLocaleDateString(language, { dateStyle: "long", timeZone: "UTC" })}
                  </small>
                )}
              </div>
              {(video.youtube?.description || video.description) && (
                <p className="video-overlay__description">
                  {video.youtube?.description || video.description}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function VideoOverlay({ videoId, background, onClose }) {
  return createPortal(
    <AnimatePresence>
      {videoId && (
        <Panel key={videoId} videoId={videoId} background={background} onClose={onClose} />
      )}
    </AnimatePresence>,
    document.body,
  );
}
