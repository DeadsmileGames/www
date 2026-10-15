import { useSearchParams } from "react-router-dom";
import { Play } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { useOptionalContent, setOptionalContent } from "../utils/consent";
import { safeHttpsUrl, safeImageUrl, safeYoutubeEmbedUrl } from "../utils/urls";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonVideos } from "../components/ui/Skeleton";
import { VideoOverlay } from "../components/videos/VideoOverlay";

const fallbackImage = "/assets/games/screenshots/light/1.png";

export function Videos() {
  const { t, language } = useLanguage();
  const optionalAllowed = useOptionalContent();
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
  const embed = latest ? safeYoutubeEmbedUrl(latest.video_url) : null;
  const external = latest ? safeHttpsUrl(latest.video_url) : null;
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
      {videos.status === "loading" && !latest ? (
        <div className="container"><SkeletonVideos /></div>
      ) : latest ? (
        <section className="rs-hero">
          <img className="game-hero__background" src={thumbnail} alt="" />
          <div className="rs-hero__overlay" />
          <div className="rs-hero__content container">
            <div className="rs-hero__identity">
              <div className="rs-hero__text-col">
                <span className="eyebrow">{t("Latest video")}</span>
                <h1 className="rs-hero__title">{latestTitle}</h1>
                {publishedDate && <time className="news-page__date" dateTime={publishedAt}>{publishedDate}</time>}
                <p>{latestDescription}</p>
                <div className="rs-hero__actions">
                  {embed && !optionalAllowed ? (
                    <button type="button" className="btn btn--primary" onClick={() => setOptionalContent(true)}>
                      <Play weight="fill" />
                      {t("Allow YouTube")}
                    </button>
                  ) : external ? (
                    <a className="btn btn--primary" href={external} target="_blank" rel="noopener noreferrer">
                      <Play weight="fill" />
                      {t("Watch video")}
                    </a>
                  ) : (
                    <button type="button" className="btn btn--primary" onClick={() => openVideo(latest)}>
                      <Play weight="fill" />
                      {t("Watch video")}
                    </button>
                  )}
                  <button type="button" className="btn btn--secondary" onClick={() => openVideo(latest)}>
                    {t("More details")}
                  </button>
                </div>
              </div>
              <div className="video-visual">
                {embed && optionalAllowed ? (
                  <iframe
                    src={`${embed}?autoplay=1&mute=1&playsinline=1&rel=0`}
                    title={latestTitle}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <img src={thumbnail} alt="" />
                    <span className="play-button"><Play size={26} weight="fill" /></span>
                  </>
                )}
              </div>
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
                    <span className="eyebrow">{video.category || t("Videos")}</span>
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
