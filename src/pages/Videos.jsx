import { useSearchParams } from "react-router-dom";
import { Play } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { safeImageUrl } from "../utils/urls";
import { SkeletonVideos } from "../components/ui/Skeleton";
import { VideoOverlay } from "../components/videos/VideoOverlay";

const fallbackImage = "/assets/games/screenshots/light/1.png";

export function Videos() {
  const { t } = useLanguage();
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

  return (
    <div className="videos-page">
      {latest && (
        <header className="rs-hero">
          <img
            className="game-hero__background"
            src={gameScreenshot}
            alt=""
            onError={(event) => {
              const image = event.currentTarget;
              if (image.dataset.fallback) {
                image.onerror = null;
                return;
              }
              image.dataset.fallback = "default";
              image.src = fallbackImage;
            }}
          />
          <div className="rs-hero__overlay" />
          <div className="rs-hero__content container">
            <h1 className="rs-hero__title">{latest.title}</h1>
            <div className="rs-hero__actions">
              <button type="button" className="btn btn--primary" onClick={() => open(latest.id)}>
                <Play size={20} weight="fill" />
                {t("Watch now")}
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
