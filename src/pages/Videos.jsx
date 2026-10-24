import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useSearchParams } from "react-router-dom";
import { Play } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { AutoLinkText } from "../components/ui/AutoLinkText";
import { useContent } from "../hooks/useContent";
import { safeImageUrl } from "../utils/urls";
import { getVideoThumbnail } from "../utils/videoThumbnail";
import { useOptionalContent } from "../utils/consent";
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
  const allowExternalVideoMedia = useOptionalContent();

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
      setHeroIndex((current) => (current + 1) % Math.min(4, orderedVideos.length));
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
  const thumbnail = getVideoThumbnail(latest, language, allowExternalVideoMedia);
  const releaseAt = latest?.youtube?.actualStartedAt || latest?.youtube?.startsAt || latest?.youtube?.publishedAt || latest?.published_at || null;
  const releaseDate =
    releaseAt && Number.isFinite(Date.parse(releaseAt))
      ? new Date(releaseAt).toLocaleDateString(language, {
          dateStyle: "long",
          timeZone: "UTC",
        })
      : null;

  return (
    <div className="videos-page videos-page--rockstar-hero">
      {latest && (
        <section className="videos-rockstar-hero" aria-label={t("Featured video")}>
          <div className="videos-rockstar-hero__layout">
            <button
              type="button"
              className="videos-rockstar-hero__media"
              onClick={() => open(latest.id)}
              aria-label={heroActionLabel}
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.img
                  key={String(latest.id) + "-" + (thumbnail || gameScreenshot)}
                  src={thumbnail || gameScreenshot}
                  alt=""
                  initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.015 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0.01 : 0.4 }}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackImage;
                  }}
                />
              </AnimatePresence>
              <span className="videos-rockstar-hero__media-shade" aria-hidden="true" />
              <span className="videos-rockstar-hero__play" aria-hidden="true">
                <Play size={26} weight="fill" />
              </span>
              <YouTubeBroadcastBadge video={latest} />
            </button>
            <div className="videos-rockstar-hero__panel">
              <div className="videos-rockstar-hero__panel-content">
                <p className="videos-rockstar-hero__eyebrow">
                  {latest?.game_title ||
                    latest?.gameTitle ||
                    latest?.game_name ||
                    (gameSlug
                      ? gameSlug.split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")
                      : t("Featured video"))}
                </p>
                <h1>{latestTitle}</h1>
                {releaseDate && (
                  <time className="videos-rockstar-hero__date" dateTime={releaseAt}>
                    {releaseDate}
                  </time>
                )}
                {latestDescription && (
                  <p className="videos-rockstar-hero__description">
                    <AutoLinkText>{latestDescription}</AutoLinkText>
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn--primary videos-rockstar-hero__action"
                  onClick={() => open(latest.id)}
                >
                  <Play size={16} weight="fill" />
                  {heroActionLabel}
                </button>
              </div>
              <div className="videos-rockstar-hero__dots" aria-label={t("Featured video")}>
                {orderedVideos.slice(0, 4).map((video, index) => (
                  <button
                    type="button"
                    key={video.id}
                    className={index === heroIndex ? "is-active" : ""}
                    aria-label={t("Show featured video {0}", { 0: index + 1 })}
                    aria-current={index === heroIndex ? "true" : undefined}
                    onClick={() => setHeroIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
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
                const image = getVideoThumbnail(video, language, allowExternalVideoMedia);
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
