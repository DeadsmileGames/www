import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Play, X, YoutubeLogo } from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { useContent } from "../../hooks/useContent";
import { setOptionalContent, useOptionalContent } from "../../utils/consent";
import { trapFocus } from "../../utils/dom";
import { safeHttpsUrl, safeImageUrl, safeYoutubeEmbedUrl } from "../../utils/urls";

const fallbackImage = "/assets/games/screenshots/light/1.png";

function Panel({ videoId, background, onClose, onSelect }) {
  const { t, language } = useLanguage();
  const allowed = useOptionalContent();
  const reducedMotion = useReducedMotion();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const resource = useContent(`/videos/${encodeURIComponent(videoId)}`);
  const relatedResource = useContent("/videos", { limit: 48 });
  const video = resource.status === "success" ? resource.data : null;
  const relatedVideos =
    relatedResource.status === "success" && Array.isArray(relatedResource.data)
      ? relatedResource.data
          .filter((item) => String(item.id) !== String(videoId))
          .sort((a, b) => {
            const gameId = video?.game_id == null ? null : String(video.game_id);
            const aMatches = gameId && String(a.game_id) === gameId ? 1 : 0;
            const bMatches = gameId && String(b.game_id) === gameId ? 1 : 0;
            return bMatches - aMatches;
          })
          .slice(0, 4)
      : [];
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
    url.searchParams.set("cc_lang_pref", playerLanguage === "pt-BR" ? "pt" : playerLanguage);
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
    <m.div
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
              <div className="video-overlay__heading">
                <div className="video-overlay__heading-copy">
                  <h2 id="video-overlay-title">{video.youtube?.title || video.title}</h2>
                  {released && Number.isFinite(Date.parse(released)) && (
                    <small>
                      {new Date(released).toLocaleDateString(language, { dateStyle: "long", timeZone: "UTC" })}
                    </small>
                  )}
                </div>
                <a
                  className="btn btn--secondary video-overlay__subscribe"
                  href="https://www.youtube.com/@DeadsmileGames?sub_confirmation=1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <YoutubeLogo size={20} weight="fill" aria-hidden="true" />
                  {t("Subscribe to the channel")}
                </a>
              </div>
            </div>
            {(video.youtube?.description || video.description) && (
              <section className="video-overlay__description-panel support-card" aria-labelledby="video-overlay-description-title">
                <h3 id="video-overlay-description-title">{t("Description")}</h3>
                <p className="video-overlay__description">
                  {video.youtube?.description || video.description}
                </p>
              </section>
            )}
            <section className="video-overlay__related" aria-labelledby="video-overlay-related-title">
              <h3 id="video-overlay-related-title">{t("Related videos")}</h3>
              {relatedVideos.length > 0 ? (
                <div className="video-overlay__related-grid">
                  {relatedVideos.map((related) => {
                    const thumbnail = safeImageUrl(related.youtube?.thumbnail || related.thumbnail);
                    return (
                      <button
                        key={related.id}
                        type="button"
                        className="video-overlay__related-tile"
                        onClick={() => onSelect(related.id)}
                      >
                        <span className="video-overlay__related-visual">
                          {thumbnail ? (
                            <img src={thumbnail} alt="" loading="lazy" />
                          ) : (
                            <span className="videos-page__preview-placeholder">
                              {t("Watch now")}
                            </span>
                          )}
                          <span className="video-overlay__related-play" aria-hidden="true">
                            <Play size={22} weight="fill" />
                          </span>
                        </span>
                        <span className="video-overlay__related-title">
                          {related.youtube?.title || related.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : relatedResource.status === "success" ? (
                <p className="video-overlay__related-empty">{t("No related videos are available yet.")}</p>
              ) : null}
            </section>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function VideoOverlay({ videoId, background, onClose, onSelect }) {
  const navigate = useNavigate();
  const selectVideo = (nextVideoId) => {
    if (onSelect) {
      onSelect(nextVideoId);
      return;
    }
    onClose?.();
    navigate(`/videos?video=${encodeURIComponent(nextVideoId)}`);
  };

  return createPortal(
    <AnimatePresence>
      {videoId && (
        <Panel
          key={videoId}
          videoId={videoId}
          background={background}
          onClose={onClose}
          onSelect={selectVideo}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}
