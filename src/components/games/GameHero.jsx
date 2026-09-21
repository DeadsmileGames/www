import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from '@phosphor-icons/react';
import { safeImageUrl } from '../../utils/urls';

export function GameHero({
  game,
  carouselIndex,
  carouselCount,
  onNext,
  onPrev,
  trailerVideos = [],
}) {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const DURATION = 6500;

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    setProgress(0);
    if (paused) return;

    const start = performance.now();
    const tick = (now) => {
      const pct = Math.min(((now - start) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [carouselIndex, paused]);

  if (!game) return null;

  const backgroundSrc = safeImageUrl(game.heroImage) || safeImageUrl(game.coverImage) || '';
  const logoSrc       = safeImageUrl(game.logo) || '';
  const title         = game.title || '';
  const eyebrow       = game.genres?.[0] || game.shortDescription || '';

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
            {eyebrow && (
              <p className="rs-hero__eyebrow">{eyebrow}</p>
            )}

            <h1 className="rs-hero__title">{title}</h1>

            <div className="rs-hero__actions">
              {trailerVideos.length > 0 && (
                <Link
                  to={`/?video=${encodeURIComponent(trailerVideos[0].id)}#videos`}
                  className="btn btn--primary watch-trailer"
                >
                  <Play weight="bold" />
                  <span>Watch Trailer</span>
                </Link>
              )}
              {game.slug && (
                <Link
                  to={`/games/${game.slug}`}
                  className="btn btn--secondary watch-trailer"
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
                    const diff = i - carouselIndex;
                    if (diff > 0) for (let d = 0; d < diff; d++) onNext();
                    if (diff < 0) for (let d = 0; d > diff; d--) onPrev();
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

          <button className="rs-hero__ctrl-btn" onClick={onPrev} aria-label="Anterior">
            <ArrowLeft size={14} weight="bold" />
          </button>

          <button className="rs-hero__ctrl-btn" onClick={onNext} aria-label="Próximo">
            <ArrowRight size={14} weight="bold" />
          </button>

        </div>
      )}
    </section>
  );
}
