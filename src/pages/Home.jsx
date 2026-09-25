import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useGames } from "../hooks/useGames";
import { useContent } from "../hooks/useContent";
import { safeImageUrl, safeHttpsUrl, safeYoutubeEmbedUrl } from "../utils/urls";
import { Modal } from "../components/ui/Modal";
import { Play, Pause, ArrowLeft, ArrowRight, ArrowUpRight, X } from "@phosphor-icons/react";

const HERO_STYLES = String.raw`
.rs-hero {
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 580px;
  overflow: hidden;
  background-color: #050505;
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  isolation: isolate;

  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.rs-hero::before {
  content: '';
  position: absolute;
  inset: -6%;
  background: inherit;
  background-size: cover;
  background-position: center top;
  z-index: 0;
  animation: rs-zoom 22s ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes rs-zoom {
  from { transform: scale(1); }
  to   { transform: scale(1.09); }
}
.rs-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(
      120% 90% at 50% 15%,
      transparent 40%,
      rgba(0, 0, 0, 0.55) 100%
    );
}

.rs-hero__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(
      to top,
  #090909ff 0%,
  #090909f0 14%,
  #090909b8 30%,
  #09090952 48%,
  #0909090f 64%,
  #09090900 78%
    );
}

.rs-hero__content {
  position: relative;
  z-index: 2;
  padding-inline: clamp(20px, 5vw, 64px);
  padding-bottom: clamp(80px, 10vw, 120px);
}

.rs-hero__identity {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.rs-hero__logo-col {
  flex-shrink: 0;
}

.rs-hero__logo {
  display: block;
  width: clamp(80px, 11vw, 148px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.75));
}

.rs-hero__text-col {
  display: flex;
  flex-direction: column;
}


.rs-hero__title {
  font-family: var(--font-body, 'Helvetica Neue', Arial, sans-serif);
  font-size: clamp(2.8rem, 6vw, 5.4rem);
  font-weight: 800;
  font-stretch: condensed;
  line-height: 0.94;
  letter-spacing: -0.03em;
  color: #ffffff;
  text-shadow: 0 6px 30px rgba(0, 0, 0, 0.5);
  margin: 0 0 28px 0;
  max-width: 16ch;
}

.rs-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}


.rs-hero__controls {
  position: absolute;
  bottom: 32px;
  right: clamp(20px, 5vw, 60px);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px 7px 8px;
  background: rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 100px;
}

.rs-hero__ctrl-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.18s ease,
    color 0.2s ease;
}

.rs-hero__ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: scale(1.1);
}

.rs-hero__ctrl-btn:active {
  transform: scale(0.9);
}

.rs-hero__pips {
  display: flex;
  align-items: center;
  gap: 5px;
}

.rs-hero__pip {
  position: relative;
  height: 3px;
  width: 28px;
  padding: 0;
  border: none;
  border-radius: 3px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: width 0.3s ease;
}

.rs-hero__pip--active {
  width: 56px;
}

.rs-hero__pip-fill {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 0%;
  border-radius: 3px;
  background: #ffffff;
  pointer-events: none;
  transition: width 0.3s ease;
}

.rs-hero__pip:not(.rs-hero__pip--active) .rs-hero__pip-fill {
  width: 100%;
  background: rgba(255, 255, 255, 0.45);
}
@media (max-width: 768px) {
  .rs-hero {
    background-position: 65% top;
  }

  .rs-hero::before {
    background-position: 65% top;
  }

  .rs-hero__content {
    padding-bottom: 96px;
  }

  .rs-hero__logo {
    width: clamp(64px, 18vw, 100px);
  }

  .rs-hero__title {
    font-size: clamp(2.1rem, 8vw, 3rem);
  }

  
  .rs-hero__controls {
    right: 50%;
    transform: translateX(50%);
    bottom: 24px;
  }
}

@media (max-width: 480px) {
  .rs-hero__identity {
    gap: 14px;
  }
  .rs-hero__ctrl-btn {
    width: 28px;
    height: 28px;
  }
  .rs-hero__pip {
    width: 22px;
  }
  .rs-hero__pip--active {
    width: 42px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rs-hero::before {
    animation: none;
  }
}
.rs-hero__actions .btn { display: inline-flex; align-items: center; gap: 8px; }
`;

function GameHero({
  game,
  carouselIndex,
  carouselCount,
  onNext,
  onPrev,
  onSelect,
  trailerVideos = [],
  onOpenTrailer,
}) {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const DURATION = 6500;

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    setProgress(0);
    if (paused || !(carouselCount > 1)) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let start = null;
    const tick = (now) => {
      if (start === null) start = now;
      const pct = Math.min(((now - start) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
      else onNextRef.current?.();
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [carouselIndex, carouselCount, paused]);

  if (!game) return null;

  const backgroundSrc = safeImageUrl(game.heroImage) || safeImageUrl(game.coverImage) || '';
  const logoSrc       = safeImageUrl(game.logo) || '';
  const title         = game.title || '';

  return (
    <section
      className="rs-hero"
      aria-label={`Featured: ${title}`}
      style={backgroundSrc ? { backgroundImage: `url(${backgroundSrc})` } : undefined}
    >
      <div className="rs-hero__overlay" />

      <div className="rs-hero__content container">
        <div className="rs-hero__identity">

          {logoSrc && (
            <div className="rs-hero__logo-col">
              <img
                src={logoSrc}
                alt={`${title} logo`}
                className="rs-hero__logo"
              />
            </div>
          )}

          <div className="rs-hero__text-col">
            <h1 className="rs-hero__title">{title}</h1>

            <div className="rs-hero__actions">
              {trailerVideos.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenTrailer?.(trailerVideos[0].id)}
                  className="btn btn--primary"
                >
                  <Play weight="bold" />
                  <span>Watch Trailer</span>
                </button>
              )}
              {trailerVideos.length === 0 && safeHttpsUrl(game.trailerUrl) && (
                <a
                  href={safeHttpsUrl(game.trailerUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                >
                  <Play weight="bold" />
                  <span>Watch Trailer</span>
                </a>
              )}
              {game.slug && (
                <Link
                  to={`/games/${game.slug}`}
                  className="btn btn--secondary"
                >
                  Explore Game
                  <ArrowUpRight weight="bold" />
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      {carouselCount > 1 && (
        <div className="rs-hero__controls">

          <button
            className="rs-hero__ctrl-btn"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Retomar' : 'Pausar'}
          >
            {paused ? (
              <Play size={14} weight="bold" />
            ) : (
              <Pause size={14} weight="bold" />
            )}
          </button>

          <div className="rs-hero__pips" role="tablist">
            {Array.from({ length: carouselCount }).map((_, i) => {
              const isActive = i === carouselIndex;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Slide ${i + 1}`}
                  className={`rs-hero__pip${isActive ? ' rs-hero__pip--active' : ''}`}
                  onClick={() => {
                    if (onSelect) onSelect(i);
                    else {
                      const diff = i - carouselIndex;
                      if (diff > 0) for (let d = 0; d < diff; d++) onNext?.();
                      if (diff < 0) for (let d = 0; d > diff; d--) onPrev?.();
                    }
                  }}
                >
                  <span
                    className="rs-hero__pip-fill"
                    style={isActive ? { width: `${progress}%` } : {}}
                  />
                </button>
              );
            })}
          </div>

          <button className="rs-hero__ctrl-btn" onClick={() => onPrev?.()} aria-label="Anterior">
            <ArrowLeft size={14} weight="bold" />
          </button>

          <button className="rs-hero__ctrl-btn" onClick={() => onNext?.()} aria-label="Próximo">
            <ArrowRight size={14} weight="bold" />
          </button>

        </div>
      )}
    </section>
  );
}

function ContentState({ resource, empty, children }) {
  if (resource.status === "loading")
    return (
      <p role="status" className="content-state">
        Loading…
      </p>
    );
  if (resource.status === "error")
    return (
      <div className="content-state" role="alert">
        <p>{resource.error}</p>
        <button onClick={resource.retry}>Try again</button>
      </div>
    );
  return children || <p className="content-state">{empty}</p>;
}

export function Home() {
  const catalog = useGames({ limit: 48 });
  const news = useContent("/news", { limit: 3 });
  const videos = useContent("/videos", { limit: 48 });
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [heroIndex, setHeroIndex] = useState(0);
  function setParams(next, options = {}) {
    navigate(
      { pathname: "/", search: next.toString(), hash: "#videos" },
      { preventScrollReset: true, ...options },
    );
  }
  const selected = params.get("video");
  const detail = useContent(
    selected ? `/videos/${encodeURIComponent(selected)}` : null,
  );
  const active = detail.status === "success" ? detail.data : null;
  const embed = safeYoutubeEmbedUrl(active?.video_url);
  const external = safeHttpsUrl(active?.video_url);
  const games = catalog.games || [];
  const featured = games.find((game) => game.featured) || games[0];
  const heroGames = featured
    ? [featured, ...games.filter((game) => game.id !== featured.id)]
    : [];
  const currentHeroIndex = heroGames.length > 0 ? heroIndex % heroGames.length : 0;
  const currentHeroGame = heroGames[currentHeroIndex];
  const trailerVideos = (Array.isArray(videos.data) ? videos.data : [])
    .filter((video) =>
      currentHeroGame &&
      (String(video.game_id || video.gameId || '') === String(currentHeroGame.id) ||
        video.game_slug === currentHeroGame.slug ||
        video.gameSlug === currentHeroGame.slug) &&
      /trailer/i.test(`${video.category || ''} ${video.title || ''}`)
    );

  function openHeroTrailer(videoId) {
    const next = new URLSearchParams(params);
    next.set("video", videoId);
    setParams(next);
  }

  function closeVideo() {
    const next = new URLSearchParams(params);
    next.delete("video");
    setParams(next, { replace: true, preventScrollReset: true });
  }
  return (
    <div className="home">
      <style>{HERO_STYLES}</style>
      <div id="home">
        <ContentState resource={catalog} empty="Our next challenge is on its way.">
          {currentHeroGame && (
            <GameHero
              game={currentHeroGame}
              carouselIndex={currentHeroIndex}
              carouselCount={heroGames.length}
              onNext={() => setHeroIndex((index) => (index + 1) % heroGames.length)}
              onPrev={() => setHeroIndex((index) => (index - 1 + heroGames.length) % heroGames.length)}
              onSelect={setHeroIndex}
              trailerVideos={trailerVideos}
              onOpenTrailer={openHeroTrailer}
            />
          )}
        </ContentState>
      </div>
      <section id="games" className="full-page-mh studio-games">
        <div className="container">
          <ContentState
            resource={catalog}
            empty="Our next challenge is on its way."
          >
            {featured && (
              <>
                <div className="game-spotlight">
                  <div>
                    <h2>{featured.title}</h2>
                    <p>{featured.shortDescription}</p>
                    <div className="studio-actions">
                      <Link
                        className="btn btn--primary"
                        to={`/games/${featured.slug}`}
                      >
                        Explore game
                      </Link>
                      <a
                        className="btn btn--primary"
                        href="#videos"
                      >
                        <Play size={20} /> Trailers
                      </a>
                    </div>
                  </div>
                  <Link
                    to={`/games/${featured.slug}`}
                    className="spotlight-art"
                  >
                    <img
                      src={
                        safeImageUrl(
                          featured.heroImage ||
                          featured.coverImage,
                        ) ||
                        "/assets/placeholders/game-cover.svg"
                      }
                      alt={featured.title}
                    />
                  </Link>
                </div>
                {games.length > 1 && (
                  <div className="studio-game-strip">
                    {games
                      .filter((g) => g.id !== featured.id)
                      .map((game) => (
                        <Link
                          key={game.id}
                          to={`/games/${game.slug}`}
                        >
                          <img
                            src={
                              safeImageUrl(
                                game.coverImage,
                              ) ||
                              "/assets/placeholders/game-cover.svg"
                            }
                            alt=""
                            loading="lazy"
                          />
                          <h3>{game.title}</h3>
                        </Link>
                      ))}
                  </div>
                )}
              </>
            )}
          </ContentState>
          <Link className="btn btn--primary" to="/games">
            See all games →
          </Link>
        </div>
      </section>
      <section id="videos" className="studio-section studio-videos">
        <div className="container">
          <header className="section-heading">
            <h2>From the games</h2>
            <p>Trailers, gameplay and a look behind the scenes.</p>
          </header>
          <ContentState
            resource={videos}
            empty="New videos are coming soon."
          >
            {videos.data?.length > 0 && (
              <div className="video-grid">
                {videos.data.map((video) => (
                  <button
                    className="video-tile"
                    key={video.id}
                    onClick={() => {
                      const next = new URLSearchParams(
                        params,
                      );
                      next.set("video", video.id);
                      setParams(next, {
                        preventScrollReset: true,
                      });
                    }}
                  >
                    <span className="video-visual">
                      {safeImageUrl(video.thumbnail) && (
                        <img
                          src={safeImageUrl(
                            video.thumbnail,
                          )}
                          alt=""
                          loading="lazy"
                        />
                      )}
                      <span className="play-button">
                        <Play size={26} weight="fill" />
                      </span>
                    </span>
                    <span className="eyebrow">
                      {video.category || "Video"}
                    </span>
                    <h3>{video.title}</h3>
                  </button>
                ))}
              </div>
            )}
          </ContentState>
        </div>
      </section>
      <section className="studio-section studio-news">
        <div className="container">
          <header className="section-heading">
            <h2>Latest from the studio</h2>
            <Link className="btn btn--primary" style={{ marginTop: '1rem' }} to="/news">
              All news →
            </Link>
          </header>
          <ContentState resource={news} empty="No announcements yet.">
            {news.data?.length > 0 && (
              <div className="news-grid">
                {news.data.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.slug}`}
                    className="news-tile"
                  >
                    {safeImageUrl(item.image) && (
                      <img
                        src={safeImageUrl(item.image)}
                        alt=""
                        loading="lazy"
                      />
                    )}
                    <small>{item.category || "News"}</small>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <span className="btn btn--primary">
                      Read story →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </ContentState>
        </div>
      </section>
      <section id="about" className="full-page-about studio-about">
        <div className="sec-about">
          <div className="div-about-us">
            <h2 className="heading-3">A little about us</h2>
            <p className="paragraph-3">
              We make games that push your limits.
              <br />
              The kind that make you fail, laugh, and try again.
            </p>
            <p className="paragraph-3">
              Every world starts with an idea.
              <br />
              Every challenge is better with you in it.
            </p>
            <Link to="/about" className="btn btn--primary">
              Meet Deadsmile Games →
            </Link>
          </div>
        </div>
      </section>
      <Modal
        open={Boolean(selected)}
        onClose={closeVideo}
        labelledBy="video-title"
      >
        <div className="video-dialog">
          <button
            className="dialog-close"
            onClick={closeVideo}
            aria-label="Close video"
          >
            <X />
          </button>
          <h2 id="video-title">{active?.title || "Video"}</h2>
          <ContentState resource={detail} empty="Video unavailable.">
            {active && (
              <>
                {embed ? (
                  <iframe
                    src={embed}
                    title={active.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : external ? (
                  <a
                    className="btn"
                    href={external}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open video
                  </a>
                ) : (
                  <p>No video source available.</p>
                )}
              </>
            )}
          </ContentState>
        </div>
      </Modal>
    </div>
  );
}
