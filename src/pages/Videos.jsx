import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useSearchParams } from "react-router-dom";
import { Play } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { useContent } from "../hooks/useContent";
import { safeImageUrl } from "../utils/urls";
import { getVideoThumbnail } from "../utils/videoThumbnail";
import { SkeletonVideos } from "../components/ui/Skeleton";
import { VideoOverlay } from "../components/videos/VideoOverlay";
import { YouTubeBroadcastBadge } from "../components/videos/YouTubeBroadcastBadge";

const fallbackImage = "/assets/games/screenshots/light/1.png";

function videoLaunchTimestamp(video) {
  const dates = [
    video?.youtube?.actualStartedAt,
    video?.youtube?.startsAt,
    video?.youtube?.publishedAt,
    video?.published_at,
  ];

  for (const value of dates) {
    const timestamp = Date.parse(value || "");
    if (Number.isFinite(timestamp)) return timestamp;
  }

  return 0;
}

export function Videos() {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const videos = useContent("/videos", { limit: 48 });

  useEffect(() => {
    const timer = window.setInterval(() => void videos.refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [videos.refresh]);
  const orderedVideos = useMemo(
    () =>
      videos.status === "success" && Array.isArray(videos.data)
        ? [...videos.data].sort(
            (a, b) => videoLaunchTimestamp(b) - videoLaunchTimestamp(a),
          )
        : [],
    [videos.data, videos.status],
  );
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (orderedVideos.length < 2) {
      setHeroIndex(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % orderedVideos.length);
    }, 10_000);

    return () => window.clearInterval(timer);
  }, [orderedVideos.length]);

  const latest = orderedVideos.length
    ? orderedVideos[heroIndex % orderedVideos.length]
    : null;
  const broadcast = latest?.youtube;
  const broadcastState = broadcast?.state || "none";
  const scheduledStartAt = broadcastState === "upcoming" ? broadcast?.startsAt : null;
  const scheduledPremiereDate =
    scheduledStartAt && Number.isFinite(Date.parse(scheduledStartAt))
      ? new Intl.DateTimeFormat(language, {
          dateStyle: "medium",
          timeZone: "America/Sao_Paulo",
        }).format(new Date(scheduledStartAt))
      : null;
  const heroActionLabel =
    broadcastState === "upcoming"
      ? scheduledPremiereDate
        ? t("Premieres on {0}", { 0: scheduledPremiereDate })
        : t("Premiere hasn't started yet")
      : broadcastState === "live"
        ? t("Watch live now")
        : broadcast?.actualStartedAt || broadcast?.actualEndedAt
          ? t("Watch replay")
          : t("Watch video");
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
  const thumbnail = getVideoThumbnail(latest, language);
  const releaseAt = latest?.youtube?.actualStartedAt || latest?.youtube?.startsAt || latest?.youtube?.publishedAt || latest?.published_at || null;
  const releaseDate =
    releaseAt && Number.isFinite(Date.parse(releaseAt))
      ? new Date(releaseAt).toLocaleDateString(language, {
          dateStyle: "long",
          timeZone: "UTC",
        })
      : null;

  return (
    <div className="videos-page">
      {latest && (
        <header className="rs-hero videos-page__hero">
          <div className="videos-page__hero-background-stage" aria-hidden="true">
            <AnimatePresence initial={false} mode="sync">
              <m.div
                key={latest.id}
                className="videos-page__hero-background-slide"
                initial={{ x: reducedMotion ? 0 : "100%" }}
                animate={{ x: 0 }}
                exit={{ x: reducedMotion ? 0 : "-100%" }}
                transition={{
                  duration: reducedMotion ? 0.01 : 0.72,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
              >
                <img
                  className="game-hero__background"
                  src={gameScreenshot}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackImage;
                  }}
                />
              </m.div>
            </AnimatePresence>
          </div>
          <div className="rs-hero__overlay" />
          <div className="rs-hero__content container">
            <div className="videos-page__hero-stage">
              <AnimatePresence initial={false} mode="sync">
                <m.div
                  key={latest.id}
                  className="videos-page__hero-slide"
                  initial={{ x: reducedMotion ? 0 : "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: reducedMotion ? 0 : "-100%" }}
                  transition={{
                    duration: reducedMotion ? 0.01 : 0.72,
                    ease: [0.22, 0.61, 0.36, 1],
                  }}
                >
                  <div className="videos-page__hero-grid">
                    <div className="videos-page__hero-copy">
                      <h1 className="rs-hero__title">{latestTitle}</h1>
                      {releaseDate && (
                        <time className="news-page__date" dateTime={releaseAt}>
                          {releaseDate}
                        </time>
                      )}
                      {latestDescription && (
                        <p className="videos-page__hero-description">{latestDescription}</p>
                      )}
                      <div className="rs-hero__actions videos-page__hero-actions">
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={() => open(latest.id)}
                        >
                          <Play size={20} weight="fill" />
                          {heroActionLabel}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="videos-page__hero-preview"
                      onClick={() => open(latest.id)}
                      aria-label={heroActionLabel}
                    >
                      {thumbnail ? (
                        <img src={thumbnail} alt="" />
                      ) : (
                        <span className="videos-page__preview-placeholder">{heroActionLabel}</span>
                      )}
                      <span className="videos-page__preview-play" aria-hidden="true">
                        <Play size={28} weight="fill" />
                      </span>
                      <YouTubeBroadcastBadge video={latest} />
                    </button>
                  </div>
                </m.div>
              </AnimatePresence>
            </div>
          </div>
        </header>
      )}
      <section className="studio-section studio-videos">
        <div className="container">
          <header className="section-heading">
            <h2>{t("All videos")}</h2>
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
                const image = getVideoThumbnail(video, language);
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
                      <YouTubeBroadcastBadge video={video} />
                    </span>
                    <h3>{video.youtube?.title || video.title}</h3>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <VideoOverlay videoId={selectedId} onClose={close} onSelect={open} />
    </div>
  );
}
