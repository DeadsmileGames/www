import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Link, useSearchParams } from "react-router-dom";
import { CaretLeft, CaretRight, Play } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { AutoLinkText } from "../components/ui/AutoLinkText";
import { useContent } from "../hooks/useContent";
import { useGames } from "../hooks/useGames";
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

function titleFromSlug(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function VideoShelf({ title, label, reducedMotion, children }) {
  const railRef = useRef(null);

  function scroll(direction) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.78, 240),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <section className="videos-shelf" aria-label={title}>
      <header className="videos-shelf__header">
        <h2>{title}</h2>
        <div className="videos-shelf__controls">
          <button
            type="button"
            className="videos-shelf__arrow"
            aria-label={label.left}
            onClick={() => scroll(-1)}
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <button
            type="button"
            className="videos-shelf__arrow"
            aria-label={label.right}
            onClick={() => scroll(1)}
          >
            <CaretRight size={20} weight="bold" />
          </button>
        </div>
      </header>
      <div className="videos-shelf__rail" ref={railRef}>
        {children}
      </div>
    </section>
  );
}

function VideoCard({ video, language, onOpen, gameLabel }) {
  const image = getVideoThumbnail(video, language);
  const title = video.youtube?.title || video.title;

  return (
    <button
      type="button"
      className="videos-card"
      onClick={() => onOpen(video.id)}
      aria-label={title}
    >
      <span className="videos-card__art">
        {image ? (
          <img src={image} alt="" loading="lazy" />
        ) : (
          <span className="videos-card__placeholder">{title}</span>
        )}
        <span className="videos-card__play" aria-hidden="true">
          <Play size={23} weight="fill" />
        </span>
        <YouTubeBroadcastBadge video={video} />
      </span>
      <span className="videos-card__copy">
        {gameLabel && <span className="videos-card__eyebrow">{gameLabel}</span>}
        <strong>{title}</strong>
      </span>
    </button>
  );
}

export function Videos() {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const videos = useContent("/videos", { limit: 48 });
  const games = useGames({ limit: 48 });

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
  const gameCatalog = Array.isArray(games.games) ? games.games : [];
  const gameLookup = useMemo(() => {
    const byId = new Map();
    const bySlug = new Map();
    for (const game of gameCatalog) {
      if (game?.id != null) byId.set(String(game.id), game);
      if (game?.slug) bySlug.set(String(game.slug), game);
    }
    return { byId, bySlug };
  }, [gameCatalog]);

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
  const selectedId = params.get("video");
  const open = (id) => {
    const next = new URLSearchParams(params);
    next.set("video", String(id));
    setParams(next, { preventScrollReset: true });
  };
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("video");
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const featuredTitle = latest?.youtube?.title || latest?.title || t("Latest videos");
  const featuredDescription =
    latest?.youtube?.description ||
    latest?.description ||
    latest?.excerpt ||
    t("Trailers, gameplay and a look behind the scenes.");
  const featuredImage =
    getVideoThumbnail(latest, language) ||
    safeImageUrl(latest?.game_screenshot) ||
    fallbackImage;
  const releaseAt =
    latest?.youtube?.actualStartedAt ||
    latest?.youtube?.startsAt ||
    latest?.youtube?.publishedAt ||
    latest?.published_at ||
    null;
  const releaseDate =
    releaseAt && Number.isFinite(Date.parse(releaseAt))
      ? new Date(releaseAt).toLocaleDateString(language, {
          dateStyle: "long",
          timeZone: "UTC",
        })
      : null;
  const featuredGame =
    (latest?.game_id != null && gameLookup.byId.get(String(latest.game_id))) ||
    (latest?.game_slug && gameLookup.bySlug.get(String(latest.game_slug))) ||
    null;
  const featuredEyebrow =
    latest?.game_title ||
    latest?.gameTitle ||
    latest?.game_name ||
    featuredGame?.title ||
    titleFromSlug(latest?.game_slug) ||
    t("Featured video");

  const videoGroups = useMemo(() => {
    const groups = new Map();
    for (const video of orderedVideos) {
      const matchingGame =
        (video?.game_id != null && gameLookup.byId.get(String(video.game_id))) ||
        (video?.game_slug && gameLookup.bySlug.get(String(video.game_slug))) ||
        null;
      const slug = video?.game_slug || matchingGame?.slug || null;
      const title =
        video?.game_title ||
        video?.gameTitle ||
        video?.game_name ||
        video?.gameName ||
        video?.game?.title ||
        matchingGame?.title ||
        titleFromSlug(slug) ||
        t("From the games");
      const key = String(video?.game_id ?? matchingGame?.id ?? slug ?? title);
      if (!groups.has(key)) groups.set(key, { key, title, slug, videos: [] });
      groups.get(key).videos.push(video);
    }
    return [...groups.values()].sort(
      (a, b) =>
        videoLaunchTimestamp(b.videos[0]) - videoLaunchTimestamp(a.videos[0]),
    );
  }, [orderedVideos, gameLookup, t]);

  const labels = {
    left: t("Scroll videos left"),
    right: t("Scroll videos right"),
  };
  const sortedGames = useMemo(
    () =>
      [...gameCatalog].sort((a, b) =>
        String(a.title || "").localeCompare(String(b.title || ""), language),
      ),
    [gameCatalog, language],
  );

  return (
    <div className="videos-page videos-showcase">
      <div className="videos-showcase__ribbon">
        <span className="videos-showcase__ribbon-mark" aria-hidden="true">DS</span>
        <span>{t("Featured video")}</span>
        <span className="videos-showcase__ribbon-separator" aria-hidden="true">•</span>
        <strong>{latest ? featuredTitle : t("Videos")}</strong>
      </div>

      {latest ? (
        <section className="videos-featured" aria-label={t("Featured video")}>
          <div className="videos-featured__layout">
            <button
              type="button"
              className="videos-featured__media"
              onClick={() => open(latest.id)}
              aria-label={t("Watch video") + ": " + featuredTitle}
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.img
                  key={String(latest.id) + "-" + featuredImage}
                  src={featuredImage}
                  alt=""
                  initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.015 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0.01 : 0.35 }}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackImage;
                  }}
                />
              </AnimatePresence>
              <span className="videos-featured__media-shade" aria-hidden="true" />
              <span className="videos-featured__play" aria-hidden="true">
                <Play size={26} weight="fill" />
              </span>
              <YouTubeBroadcastBadge video={latest} />
            </button>

            <div className="videos-featured__panel">
              <div className="videos-featured__panel-content">
                <p className="videos-featured__eyebrow">{featuredEyebrow}</p>
                <h1>{featuredTitle}</h1>
                {releaseDate && (
                  <time dateTime={releaseAt} className="videos-featured__date">
                    {releaseDate}
                  </time>
                )}
                {featuredDescription && (
                  <p className="videos-featured__description">
                    <AutoLinkText>{featuredDescription}</AutoLinkText>
                  </p>
                )}
                <button
                  type="button"
                  className="videos-featured__action"
                  onClick={() => open(latest.id)}
                >
                  <Play size={16} weight="fill" />
                  {t("Watch video")}
                </button>
              </div>

              <div className="videos-featured__dots" aria-label={t("Featured video")}>
                {orderedVideos.slice(0, Math.min(6, orderedVideos.length)).map((video, index) => (
                  <button
                    type="button"
                    key={video.id}
                    className={index === heroIndex % Math.min(6, orderedVideos.length) ? "is-active" : ""}
                    aria-label={t("Show featured video {0}", { 0: index + 1 })}
                    aria-current={index === heroIndex % Math.min(6, orderedVideos.length) ? "true" : undefined}
                    onClick={() => setHeroIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="videos-featured videos-featured--loading">
          <div className="videos-featured__layout">
            <div className="videos-featured__loading-media" role="status" aria-label={t("Loading")}>
              <span>{t("Loading")}</span>
            </div>
            <div className="videos-featured__panel">
              <p className="videos-featured__eyebrow">{t("Videos")}</p>
              <h1>{t("Latest videos")}</h1>
              <p>{t("Trailers, gameplay and a look behind the scenes.")}</p>
            </div>
          </div>
        </section>
      )}

      <main className="videos-showcase__content">
        {videos.status === "loading" && (
          <div className="videos-showcase__state" role="status" aria-label={t("Loading")}>
            <SkeletonVideos />
          </div>
        )}
        {videos.status === "error" && (
          <div className="videos-showcase__state" role="alert">
            <p>{videos.error}</p>
            <button type="button" className="videos-showcase__retry" onClick={videos.retry}>
              {t("Try again")}
            </button>
          </div>
        )}
        {videos.status === "success" && orderedVideos.length === 0 && (
          <div className="videos-showcase__state">{t("New videos are coming soon.")}</div>
        )}

        {videos.status === "success" && videoGroups.map((group) => (
          <VideoShelf
            key={group.key}
            title={t("Videos from {0}", { 0: group.title })}
            label={labels}
            reducedMotion={reducedMotion}
          >
            {group.videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                language={language}
                onOpen={open}
                gameLabel={video.category || null}
              />
            ))}
          </VideoShelf>
        ))}

        {sortedGames.length > 0 && games.status === "success" && (
          <VideoShelf title={t("By game")} label={labels} reducedMotion={reducedMotion}>
            {sortedGames.map((game) => {
              const cover = safeImageUrl(
                game.coverImage || game.cover_image || game.image || game.thumbnail,
              );
              const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(game.slug || "")
                ? game.slug
                : null;
              return (
                <Link
                  className="videos-game-card"
                  key={game.id || game.slug || game.title}
                  to={slug ? `/games/${encodeURIComponent(slug)}` : "/games"}
                >
                  <span className="videos-game-card__art">
                    {cover ? (
                      <img src={cover} alt="" loading="lazy" />
                    ) : (
                      <span className="videos-game-card__placeholder">{game.title}</span>
                    )}
                    <span className="videos-game-card__open" aria-hidden="true">↗</span>
                  </span>
                  <strong>{game.title}</strong>
                  {game.status && <small>{game.status}</small>}
                </Link>
              );
            })}
          </VideoShelf>
        )}
      </main>
      <VideoOverlay videoId={selectedId} onClose={close} onSelect={open} />
    </div>
  );
}
