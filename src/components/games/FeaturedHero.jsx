import { useLanguage } from "../../context/LanguageContext";
import { AutoLinkText } from "../ui/AutoLinkText";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Pause, Play, Info } from "@phosphor-icons/react";
import { safeImageUrl, safeHttpsUrl } from "../../utils/urls";
import { useOptionalContent } from "../../utils/consent";
import { Skeleton, SkeletonLines } from "../ui/Skeleton";

export const ABBY_VIDEO_ID = "7huKuYunpPU";
export const HERO_CLIP = { startSeconds: 0, endSeconds: 30 };
export const isAbby = (game) =>
  /^abby['’]?s restless heart$/i.test(String(game?.title || "").trim()) ||
  game?.slug === "abbys-restless-heart" ||
  game?.slug === "abby-s-restless-heart";

function BackgroundVideo({ paused }) {
  const { t } = useLanguage();
  const frame = useRef(null);
  const playerRef = useRef(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  useEffect(() => {
    let alive = true;
    let player;
    let timer;
    const host = frame.current;
    const iframe = document.createElement("iframe");
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      controls: "0",
      playsinline: "1",
      disablekb: "1",
      fs: "0",
      rel: "0",
      enablejsapi: "1",
      origin: window.location.origin,
      start: String(HERO_CLIP.startSeconds),
      end: String(HERO_CLIP.endSeconds),
    });
    iframe.src = `https://www.youtube-nocookie.com/embed/${ABBY_VIDEO_ID}?${params}`;
    iframe.title = t("Abby's Restless Heart background");
    iframe.tabIndex = -1;
    iframe.setAttribute("aria-hidden", "true");
    iframe.allow = "autoplay; encrypted-media";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
      border: "0",
      pointerEvents: "none",
    });
    host.appendChild(iframe);
    const script = document.createElement("script");
    const previousReady = window.onYouTubeIframeAPIReady;
    function ready() {
      if (!alive || !frame.current || !window.YT?.Player) return;
      player = new window.YT.Player(iframe, {
        events: {
          onReady(event) {
            if (!alive) return;
            playerRef.current = event.target;
            event.target.mute();
            if (!pausedRef.current) event.target.playVideo();
            else event.target.pauseVideo();
            timer = setInterval(() => {
              if (!alive || pausedRef.current) return;
              if (event.target.getCurrentTime() >= HERO_CLIP.endSeconds - 0.1) {
                event.target.loadVideoById({ videoId: ABBY_VIDEO_ID, ...HERO_CLIP });
                event.target.mute();
              }
            }, 200);
          },
          onStateChange(event) {
            if (alive && event.data === 0 && !pausedRef.current) {
              event.target.loadVideoById({ videoId: ABBY_VIDEO_ID, ...HERO_CLIP });
              event.target.mute();
            }
          },
        },
      });
    }
    const onReady = () => {
      previousReady?.();
      ready();
    };
    if (window.YT?.Player) ready();
    else {
      window.onYouTubeIframeAPIReady = onReady;
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
    return () => {
      alive = false;
      clearInterval(timer);
      playerRef.current = null;
      player?.destroy();
      host.replaceChildren();
      script.remove();
      if (window.onYouTubeIframeAPIReady === onReady)
        window.onYouTubeIframeAPIReady = previousReady;
    };
  }, []);
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (paused) player.pauseVideo();
    else {
      player.mute();
      player.playVideo();
    }
  }, [paused]);
  return (
    <div
      ref={frame}
      className="game-hero__background"
      aria-hidden="true"
      style={{ pointerEvents: "none", opacity: 1 }}
    />
  );
}

export function FeaturedHero({
  games,
  status,
  error,
  onRetry,
  onTrailer,
  suspended = false,
}) {
  const { t } = useLanguage();
  const allowed = useOptionalContent();
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const featured = games.filter((game) => game.featured);
  const slides = featured.length ? featured : games;
  const selectedIndex = Math.min(index, Math.max(0, slides.length - 1));
  const game = slides[selectedIndex];
  const stopped = paused || interacting || reducedMotion || !visible || suspended;
  useEffect(() => {
    const change = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  useEffect(() => {
    if (stopped || slides.length < 2) return;
    const timer = setTimeout(
      () => setIndex((selectedIndex + 1) % slides.length),
      isAbby(game) ? 30000 : 8000,
    );
    return () => clearTimeout(timer);
  }, [selectedIndex, slides.length, stopped, game?.id]);
  const background =
    isAbby(game) || !game
      ? "/assets/games/screenshots/abbys-restless-heart/1.png"
      : safeImageUrl(game.coverImage) ||
        safeImageUrl(game.heroImage) ||
        "/assets/placeholders/game-hero.svg";
  const move = (delta) =>
    setIndex((selectedIndex + delta + slides.length) % slides.length);
  return (
    <section
      id="home"
      className="studio-landing rs-hero"
      aria-label={t("Featured games")}
      aria-roledescription="carousel"
      style={{
        backgroundImage: `url(${JSON.stringify(background)})`,
        overflow: "hidden",
      }}
    >
      {allowed && !reducedMotion && isAbby(game) && <BackgroundVideo paused={paused} />}
      <div className="rs-hero__overlay" />
      <div
        className="container"
        style={{ zIndex: 1 }}
        onMouseEnter={() => setInteracting(true)}
        onMouseLeave={() => setInteracting(false)}
        onFocus={() => setInteracting(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
        }}
      >
        {status === "loading" && (
          <div className="support-card support-contact-panel">
            <Skeleton style={{ height: 60, width: "65%", marginBottom: 24 }} />
            <SkeletonLines count={2} />
            <div className="studio-actions" style={{ marginTop: 24 }}>
              <Skeleton style={{ height: 48, width: 160 }} />
              <Skeleton style={{ height: 48, width: 160 }} />
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="support-card support-contact-panel" role="alert">
            <p>{t(error)}</p>
            <button className="btn btn--secondary" onClick={onRetry}>
              {t("Try again")}
            </button>
          </div>
        )}
        {status === "success" && !slides.length && (
          <img
            src="/assets/branding/typo.svg"
            className="hero-logo"
            alt="Deadsmile Games"
          />
        )}
        <div
          style={{
            display: "flex",
            gap: 24,
            transform: `translateX(calc(-${selectedIndex} * (100% + 24px)))`,
            transition: reducedMotion ? "none" : "transform 350ms ease",
          }}
        >
          {slides.map((item, slide) => (
            <article
              key={item.id}
              className="support-card support-contact-panel"
              aria-hidden={slide !== selectedIndex}
              inert={slide !== selectedIndex ? "" : undefined}
              style={{
                flex: "0 0 100%",
                minWidth: 0,
                opacity: slide === selectedIndex ? 1 : 0.5,
              }}
            >
              <h1 className="rs-hero__title">{item.title}</h1>
              <p className="game-hero__description"><AutoLinkText>{item.shortDescription}</AutoLinkText></p>
              <div className="studio-actions">
                <Link
                  className="btn btn--primary"
                  to={`/games/${encodeURIComponent(item.slug)}`}
                >
                  <Info size={20} />
                  {t("Learn more")}
                </Link>
                {(safeHttpsUrl(item.trailerUrl) || isAbby(item)) && (
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => onTrailer(item)}
                  >
                    <Play size={20} />
                    {t("View trailer")}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {slides.length > 0 && (
          <div className="studio-actions" style={{ marginTop: 24 }}>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => {
                setPaused(!paused);
                if (paused) setInteracting(false);
              }}
              aria-label={paused ? t("Resume featured games") : t("Pause featured games")}
              aria-pressed={paused}
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            {slides.length > 1 && (
              <>
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => move(-1)}
                  aria-label={t("Previous game")}
                >
                  <ArrowLeft size={18} />
                </button>
                <span aria-live={stopped ? "polite" : "off"}>
                  {selectedIndex + 1} / {slides.length}
                </span>
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => move(1)}
                  aria-label={t("Next game")}
                >
                  <ArrowRight size={18} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
