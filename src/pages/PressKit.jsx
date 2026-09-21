import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, GameController } from '@phosphor-icons/react';
import { Reveal } from '../components/ui/Reveal';
import { api } from '../services/api';
import { Lightbox } from '../components/ui/Lightbox';

export function PressKit() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.get('/games', { limit: 48 })
      .then((data) => {
        if (!cancelled) {
          const items = Array.isArray(data) ? data : data.items || [];
          setGames(items);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Unable to load games.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const totalImages = 9;
  const galleryImages = Array.from(
    { length: totalImages },
    (_, i) => `/assets/media/press/${i + 1}.png`
  );

  const openLightbox = (index) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goPrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + galleryImages.length) % galleryImages.length);
  };

  const goNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % galleryImages.length);
  };



  return (
    <div className="press-kit-page container">
      <Link to="/" className="back-link">
        <ArrowLeft weight="bold" />
        <span>Back</span>
      </Link>

      <Reveal>
        <header className="press-kit__header">
          <h1>Press Kit</h1>
          <p className="press-kit__intro">
            Resources for journalists, streamers, and content creators.
            All assets are free to use for coverage and promotion of Deadsmile Games.
          </p>
          <div className="press-kit__contact">
            <a href="mailto:deadsmilegames@gmail.com">deadsmilegames@gmail.com</a>
          </div>
        </header>
      </Reveal>

      <section className="press-kit__download">
        <Reveal>
          <div className="download-card">
            <div>
              <h2>Media Pack</h2>
              <p>
                Includes logos, screenshots, concept art, wallpapers, and fact sheet.
                Updated with each major release.
              </p>
            </div>
            <a
              href="/press/deadsmile-press-kit.zip"
              className="btn btn--primary"
              download
            >
              <Download weight="bold" />
              Download .zip (≈ 1 MB)
            </a>
          </div>
        </Reveal>
      </section>

      <section className="press-kit__games">
        <Reveal>
          <h2>Game Fact Sheets</h2>
          <p className="press-kit__subsection-intro">
            Official details for each title. Feel free to use these descriptions in your articles.
          </p>
        </Reveal>

        {loading && <p className="press-kit__loading">Loading games...</p>}
        {error && <p className="press-kit__error">{error}</p>}

        {!loading && !error && games.length === 0 && (
          <p className="press-kit__empty">No games available yet.</p>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="press-kit__game-grid">
            {games.map((game, index) => (
              <Reveal key={game.id} delay={index * 60}>
                <article className="press-kit__game-card">
                  <div className="press-kit__game-header">
                    <GameController weight="bold" size={24} />
                    <h3>{game.title}</h3>
                  </div>
                  <ul className="press-kit__game-meta">
                    <li><strong>Genre:</strong> {game.genres?.join(', ') || '—'}</li>
                    <li><strong>Platforms:</strong> {game.platforms?.join(', ') || '—'}</li>
                    <li><strong>Release:</strong> {game.releaseDate ? new Date(game.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' }) : 'To be announced'}</li>
                    <li><strong>Status:</strong> {game.status?.replace('_', ' ') || '—'}</li>
                  </ul>
                  <p>{game.shortDescription || game.description || 'No description available.'}</p>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="press-kit__gallery">
        <Reveal>
          <h2>Media Gallery</h2>
          <p className="press-kit__subsection-intro">
            Official logos, key art, screenshots, and concept visuals.
          </p>
        </Reveal>
        <div className="press-kit__gallery-grid">
          {galleryImages.map((src, i) => (
            <div
              className="press-kit__gallery-item"
              key={i}
              onClick={() => openLightbox(i)}
              role="button"
              tabIndex={0}
              aria-label={`Open image ${i + 1}`}
            >
              <img src={src} alt={`Press kit media ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      <section className="press-kit__guidelines">
        <Reveal>
          <h2>Usage Guidelines</h2>
          <ul>
            <li>All assets are provided for <strong>editorial and promotional</strong> purposes only.</li>
            <li>You may crop, resize, or overlay text on images, but do not alter logos or artwork in a misleading way.</li>
            <li>Always credit <strong>Deadsmile Games</strong> when using these assets.</li>
            <li>For commercial use outside editorial coverage, please contact <a href="mailto:deadsmilegames@gmail.com">deadsmilegames@gmail.com</a>.</li>
          </ul>
        </Reveal>
      </section>

      <Lightbox
        images={galleryImages}
        selectedIndex={selectedIndex}
        onClose={closeLightbox}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}