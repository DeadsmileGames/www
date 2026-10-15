import { useSearchParams } from "react-router-dom";
import { Play } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { safeImageUrl } from "../utils/urls";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonVideos } from "../components/ui/Skeleton";
import { VideoOverlay } from "../components/videos/VideoOverlay";

const fallbackImage = "/assets/games/screenshots/light/1.png";

export function Videos() {
  const { t, language } = useLanguage();
  const videos = useContent("/videos", { limit: 50 });
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("video");
  const details = useContent(selectedId ? `/videos/${encodeURIComponent(selectedId)}` : null);
  const items = Array.isArray(videos.data) ? videos.data : [];
  const latest = items[0] || null;
  const selected =
    (selectedId && items.find((video) => video.id === selectedId)) ||
    (details.status === "success" ? details.data : null);

  function closeVideo() {
    const next = new URLSearchParams(params);
    next.delete("video");
    setParams(next, { replace: true, preventScrollReset: true });
  }

  function openVideo(video) {
    const next = new URLSearchParams(params);
    next.set("video", video.id);
    setParams(next, { preventScrollReset: true });
  }

  const latestTitle = latest?.youtube?.title || latest?.youtube_title || latest?.title || t("Latest videos");
  const latestDescription =
    latest?.youtube?.description ||
    latest?.youtube_description ||
    latest?.description ||
    latest?.excerpt ||
    t("Video highlights from Deadsmile Games.");
  const thumbnail = safeImageUrl(latest?.youtube?.thumbnail || latest?.youtube_thumbnail || latest?.thumbnail) || fallbackImage;
  const gameScreenshot =
    safeImageUrl(latest?.game_screenshot) ||
    (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(latest?.game_slug || "")
      ? safeImageUrl(`/assets/games/screenshots/${latest.game_slug}/1.png`)
      : null) ||
    fallbackImage;
  const publishedAt = latest?.youtube?.publishedAt || latest?.youtube_published_at || latest?.published_at;
  const publishedDate =
    publishedAt && Number.isFinite(Date.parse(publishedAt))
      ? new Date(publishedAt).toLocaleDateString(language, {
          dateStyle: "long",
          timeZone: "UTC",
        })
      : null;

  return (
    <div className="videos-page">
      {videos.status === "loading" && !latest ? null : latest ? (
        <section className="rs-hero">
          <img
            className="game-hero__background"
            src={gameScreenshot}
            alt=""
            onError={(event) => {
              const image = event.currentTarget;
              if (image.dataset.fallback === "default") {
                image.onerror = null;
                return;
              }
              if (image.dataset.fallback === "thumbnail" || !thumbnail) {
                image.dataset.fallback = "default";
                image.src = fallbackImage;
              } else {
                image.dataset.fallback = "thumbnail";
                image.src = thumbnail;
              }
            }}
          />
          <div className="rs-hero__overlay" />
          <div className="rs-hero__content container">
            <div className="rs-hero__identity">
              <div className="rs-hero__text-col">
                <h1 className="rs-hero__title">{latestTitle}</h1>
                {publishedDate && <time className="news-page__date" dateTime={publishedAt}>{publishedDate}</time>}
                <p>{latestDescription}</p>
                <div className="rs-hero__actions">
                  <button type="button" className="btn btn--primary" onClick={() => openVideo(latest)}>
                    <Play weight="fill" />
                    {t("Watch video")}
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="video-visual video-visual--featured"
                onClick={() => openVideo(latest)}
                aria-label={t("Watch video")}
              >
                <img src={thumbnail} alt="" />
                <span className="play-button"><Play size={26} weight="fill" /></span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="studio-section">
          <div className="container">
            <header className="section-heading">
              <h1>{t("Videos")}</h1>
              <p>{t("New videos are coming soon.")}</p>
            </header>
            {videos.status === "error" && <ErrorState message={videos.error} onRetry={videos.retry} />}
          </div>
        </section>
      )}

      <section className="studio-section studio-videos studio-news">
        <div className="container">
          <header className="section-heading">
            <h2>{t("All videos")}</h2>
            <p>{t("Trailers, gameplay and a look behind the scenes.")}</p>
          </header>
          {videos.status === "error" && items.length > 0 && <ErrorState message={videos.error} onRetry={videos.retry} />}
          {videos.status === "loading" && <SkeletonVideos />}
          {videos.status === "success" && items.length === 0 && <p className="content-state">{t("New videos are coming soon.")}</p>}
          {items.length > 0 && (
            <div className="video-grid">
              {items.map((video) => {
                const videoTitle = video.youtube?.title || video.youtube_title || video.title;
                const image = safeImageUrl(video.youtube?.thumbnail || video.youtube_thumbnail || video.thumbnail);
                const date = video.youtube?.publishedAt || video.youtube_published_at || video.published_at;
                return (
                  <button type="button" className="video-tile" key={video.id} onClick={() => openVideo(video)}>
                    <span className="video-visual">
                      {image && <img src={image} alt="" loading="lazy" />}
                      <span className="play-button"><Play size={26} weight="fill" /></span>
                    </span>
                    <h3>{videoTitle}</h3>
                    {date && Number.isFinite(Date.parse(date)) && (
                      <time className="news-page__date" dateTime={date}>
                        {new Date(date).toLocaleDateString(language, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </time>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <VideoOverlay video={selected} onClose={closeVideo} />
    </div>
  );
}
