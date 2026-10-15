import { useSearchParams } from "react-router-dom";
import { Play } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { safeImageUrl } from "../utils/urls";
import { SkeletonVideos } from "../components/ui/Skeleton";
import { VideoOverlay } from "../components/videos/VideoOverlay";

const fallbackImage = "/assets/games/screenshots/light/1.png";

export function Videos() {
  const { t, language } = useLanguage();
  const [params, setParams] = useSearchParams();
  const videos = useContent("/videos", { limit: 48 });
  const latest = videos.status === "success" ? videos.data[0] : null;
  const selectedId = params.get("video");
  const open = (id) => {
    const next = new URLSearchParams(params);
    next.set("video", id);
    setParams(next, { preventScrollReset: true });
  };
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("video");
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const gameSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(latest?.game_slug || "")
    ? latest.game_slug
    : null;
  const gameScreenshot =
    safeImageUrl(latest?.game_screenshot) ||
    (gameSlug ? safeImageUrl(`/assets/games/screenshots/${gameSlug}/1.png`) : null) ||
    fallbackImage;
  const latestTitle = latest?.youtube?.title || latest?.title || t("Latest videos");
  const latestDescription =
    latest?.youtube?.description ||
    latest?.description ||
    latest?.excerpt ||
    t("Video highlights from Deadsmile Games.");
  const thumbnail = safeImageUrl(latest?.youtube?.thumbnail || latest?.thumbnail);
  const publishedAt = latest?.youtube?.publishedAt || latest?.published_at;
  const publishedDate =
    publishedAt && Number.isFinite(Date.parse(publishedAt))
      ? new Date(publishedAt).toLocaleDateString(language, {
          dateStyle: "long",
          timeZone: "UTC",
        })
      : null;

  return (
    <div className="videos-page">
      {latest && (
        <header className="rs-hero videos-page__hero">
          <img
            className="game-hero__background"
            src={gameScreenshot}
            alt=""
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackImage;
            }}
          />
          <div className="rs-hero__overlay" />
          <div className="rs-hero__content container">
            <div className="videos-page__hero-grid">
              <div className="videos-page__hero-copy">
                <h1 className="rs-hero__title">{latestTitle}</h1>
                {publishedDate && (
                  <time className="news-page__date" dateTime={publishedAt}>
                    {publishedDate}
                  </time>
                )}
                {latestDescription && (
                  <p className="videos-page__hero-description">{latestDescription}</p>
                )}
                <div className="rs-hero__actions videos-page__hero-actions">
                  <button type="button" className="btn btn--primary" onClick={() => open(latest.id)}>
                    <Play size={20} weight="fill" />
                    {t("Watch now")}
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="videos-page__hero-preview"
                onClick={() => open(latest.id)}
                aria-label={t("Watch now")}
              >
                {thumbnail ? (
                  <img src={thumbnail} alt="" />
                ) : (
                  <span className="videos-page__preview-placeholder">{t("Watch now")}</span>
                )}
                <span className="videos-page__preview-play" aria-hidden="true">
                  <Play size={28} weight="fill" />
                </span>
              </button>
            </div>
          </div>
        </header>
      )}
      <section className="studio-section studio-videos">
        <div className="container">
          <header className="section-heading">
            <h2>{t("From the games")}</h2>
            <p>{t("Trailers, gameplay and a look behind the scenes.")}</p>
          </header>
          {videos.status === "loading" && (
            <div role="status" aria-label={t("Loading")} className="content-state">
              <SkeletonVideos />
            </div>
          )}
          {videos.status === "error" && (
            <div className="content-state" role="alert">
              <p>{videos.error}</p>
              <button type="button" onClick={videos.retry}>
                {t("Try again")}
              </button>
            </div>
          )}
          {videos.status === "success" && !videos.data.length && (
            <p className="content-state">{t("New videos are coming soon.")}</p>
          )}
          {videos.status === "success" && videos.data.length > 0 && (
            <div className="video-grid">
              {videos.data.map((video) => {
                const image = safeImageUrl(video.youtube?.thumbnail || video.thumbnail);
                return (
                  <button
                    type="button"
                    className="video-tile"
                    key={video.id}
                    onClick={() => open(video.id)}
                  >
                    <span className="video-visual">
                      {image && <img src={image} alt="" loading="lazy" />}
                      <span className="play-button">
                        <Play size={26} weight="fill" />
                      </span>
                    </span>
                    <h3>{video.youtube?.title || video.title}</h3>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <VideoOverlay videoId={selectedId} onClose={close} />
    </div>
  );
}
