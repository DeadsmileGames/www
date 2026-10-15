import { X } from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { useOptionalContent, setOptionalContent } from "../../utils/consent";
import { safeHttpsUrl, safeImageUrl, safeYoutubeEmbedUrl } from "../../utils/urls";
import { Modal } from "../ui/Modal";

const fallbackImage = "/assets/games/screenshots/light/1.png";

export function VideoOverlay({ video, onClose }) {
  const { t, language } = useLanguage();
  const optionalAllowed = useOptionalContent();
  if (!video) return null;

  const title = video.youtube?.title || video.youtube_title || video.title || t("Videos");
  const description =
    video.youtube?.description ||
    video.youtube_description ||
    video.description ||
    video.excerpt;
  const thumbnail = safeImageUrl(video.youtube?.thumbnail || video.youtube_thumbnail || video.thumbnail);
  const gameSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(video.game_slug || "")
    ? video.game_slug
    : null;
  const background =
    safeImageUrl(video.screenshots?.[0]) ||
    safeImageUrl(video.game_screenshot) ||
    (gameSlug ? safeImageUrl(`/assets/games/screenshots/${gameSlug}/1.png`) : null) ||
    thumbnail ||
    fallbackImage;
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

  return (
    <Modal
      open={Boolean(video)}
      onClose={onClose}
      labelledBy="video-overlay-title"
      overlayClassName="video-overlay"
      panelClassName="video-overlay__panel"
      backdrop={
        <div className="video-overlay__backdrop" aria-hidden="true">
          <img src={background} alt="" />
          <span className="video-overlay__shade" />
        </div>
      }
    >
      <div className="video-dialog">
        <button
          type="button"
          className="dialog-close video-overlay__close"
          onClick={onClose}
          aria-label={t("Close video")}
        >
          <X />
        </button>
        <h2 id="video-overlay-title">{title}</h2>
        {publishedDate && <time className="news-page__date" dateTime={publishedAt}>{publishedDate}</time>}
        {description && <p className="video-dialog__description">{description}</p>}
        {embed && optionalAllowed ? (
          <iframe
            src={`${embed}?autoplay=1&mute=1&playsinline=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : embed ? (
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
        ) : external ? (
          <a className="btn btn--secondary" href={external} target="_blank" rel="noopener noreferrer">
            {t("Open video")}
          </a>
        ) : (
          <p>{t("Video unavailable.")}</p>
        )}
      </div>
    </Modal>
  );
}
