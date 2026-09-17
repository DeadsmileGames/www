import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { GameHero } from '../components/games/GameHero';
import { GameMeta } from '../components/games/GameMeta';
import { GameGrid } from '../components/games/GameGrid';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { Lightbox } from '../components/ui/Lightbox';
import { Modal } from '../components/ui/Modal';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { safeHttpsUrl, safeImageUrl, safeItchUrl, safeOAuthItchUrl } from '../utils/urls';
import { ArrowLeft, ShoppingCart, Heart, HeartStraight, Play, DownloadSimple, GameController } from '@phosphor-icons/react';
import './GameDetails.css';

const LAUNCHER_DOWNLOAD_URL = 'https://github.com/deadsmilegames/launcher/releases/latest';

export function GameDetails() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const { status: authStatus } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({
    status: 'loading',
    game: null,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [owned, setOwned] = useState(false);
  const [purchase, setPurchase] = useState({ open: false, status: 'idle', message: '' });
  const [launcherMissing, setLauncherMissing] = useState(false);

  const game = state.game;
  const gameId = game?.id || null;
  const isValidGameId = gameId && typeof gameId === 'string' && gameId.length > 0;
  const { inWishlist, loading: wishlistLoading, toggle } = useWishlist(isValidGameId ? gameId : null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', game: null, error: null });

    api.get(`/games/${encodeURIComponent(slug)}`)
      .then((game) => {
        if (!cancelled) setState({ status: 'success', game, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: err.status === 404 ? 'not-found' : 'error',
            game: null,
            error: err.message,
          });
        }
      });

    return () => { cancelled = true; };
  }, [slug, revision]);

  useEffect(() => {
    setOwned(false);
    if (authStatus !== 'authenticated' || !gameId) return undefined;
    let active = true;
    api.get('/library')
      .then((data) => { if (active) setOwned((data?.items || []).some((item) => item.id === gameId)); })
      .catch(() => {});
    return () => { active = false; };
  }, [authStatus, gameId]);

  async function verifyPurchase(openCheckout = true) {
    if (authStatus !== 'authenticated') {
      navigate('/login', { state: { from: `/games/${slug}` } });
      return;
    }
    try {
      setPurchase({ open: true, status: 'checking', message: '' });
      const result = await api.post(`/library/${gameId}/verify`);
      if (result.owned) {
        setOwned(true);
        setPurchase({ open: true, status: 'owned', message: '' });
        return;
      }
      setPurchase({ open: true, status: 'checkout', message: '' });
      const checkoutUrl = safeItchUrl(result.purchaseUrl);
      if (openCheckout && checkoutUrl) window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      if (error?.code === 'ITCH_NOT_CONNECTED') {
        setPurchase({ open: true, status: 'connect', message: '' });
      } else {
        setPurchase({ open: true, status: 'error', message: 'We could not verify this purchase right now. Please try again.' });
      }
    }
  }

  async function connectItch() {
    try {
      const result = await api.post('/integrations/itch/connect', {
        client: 'site',
        locale: 'en',
        returnPath: `/games/${slug}`,
      });
      const authorizeUrl = safeOAuthItchUrl(result.authorizeUrl);
      if (!authorizeUrl) throw new Error('Invalid OAuth redirect.');
      window.location.assign(authorizeUrl);
    } catch {
      setPurchase({ open: true, status: 'error', message: 'We could not start the itch.io connection right now.' });
    }
  }
  function openInLauncher() {
    setLauncherMissing(false);
    if (!/^[0-9a-f-]{36}$/i.test(String(gameId || ''))) return;
    const url = `deadsmile://launch?gameId=${encodeURIComponent(gameId)}`;
    window.location.href = url;
    const timer = setTimeout(() => setLauncherMissing(true), 2000);
    const cleanup = () => clearTimeout(timer);
    window.addEventListener('blur', cleanup, { once: true });
    window.addEventListener('visibilitychange', cleanup, { once: true });
  }

  useEffect(() => {
    if (!purchase.open || purchase.status !== 'checkout') return undefined;
    const onFocus = () => verifyPurchase(false);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [purchase.open, purchase.status, gameId]);

  const screenshots = (game
    ? (game.screenshots && game.screenshots.length > 0
        ? game.screenshots
        : Array.from({ length: 6 }, (_, i) =>
            `/assets/games/screenshots/${game.slug}/${i + 1}.png`
          ))
    : []).map(safeImageUrl).filter(Boolean);
  const gameVideos = game?.videos || [];
  const trailerVideos = gameVideos.filter((video) => String(video.category || '').toLowerCase() === 'trailer');
  const labelledVideos = gameVideos.map((video) => {
    const category = String(video.category || 'Video').trim();
    const peers = gameVideos.filter((item) => String(item.category || '').toLowerCase() === category.toLowerCase());
    const index = peers.findIndex((item) => item.id === video.id);
    return { ...video, label: peers.length > 1 ? `${category} ${index + 1}` : category };
  });

  const openLightbox = (index) => setSelectedImageIndex(index);
  const closeLightbox = () => setSelectedImageIndex(null);
  const goPrev = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex - 1 + screenshots.length) % screenshots.length);
  };
  const goNext = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % screenshots.length);
  };

  if (state.status === 'loading') {
    return (
      <div className="game-details container">
        <Skeleton style={{ height: '60vh', marginTop: 'var(--header-height)' }} />
      </div>
    );
  }

  if (state.status === 'not-found') {
    return (
      <div className="container game-details__notfound">
        <ErrorState
          title="GAME NOT FOUND"
          message="That title doesn't exist in our catalog."
        />
        <Link to="/games" className="btn btn--secondary">
          <ArrowLeft weight="bold" />
          <span>Browse games</span>
        </Link>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="container game-details__notfound">
        <Link to="/games" className="back-link">
          <ArrowLeft weight="bold" />
          <span>Back</span>
        </Link>
        <ErrorState
          message={state.error}
          onRetry={() => setRevision((v) => v + 1)}
        />
      </div>
    );
  }

  return (
    <div className="game-details">
      <GameHero
        game={game}
        isDetail
        trailerVideos={trailerVideos}
      />

      <div className="container game-details__body">
        <div className="game-details__main">
          <h2>{t('games.about')}</h2>
          <p>{game.description || game.shortDescription}</p>

          <div className="game-details__actions">
            {game.commerceEnabled && !owned && (
              <button
                type="button"
                onClick={() => verifyPurchase(true)}
                className="btn btn--primary game-details__btn"
              >
                <ShoppingCart weight="bold" />
                <span>Buy on itch.io</span>
              </button>
            )}

            {game.commerceEnabled && owned && (
              <button
                type="button"
                onClick={openInLauncher}
                className="btn btn--primary game-details__btn"
              >
                <GameController weight="bold" />
                <span>Play in Launcher</span>
              </button>
            )}
            {launcherMissing && (
              <p className="game-details__launcher-hint">
                Launcher not found.{' '}
                <a
                  href={LAUNCHER_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download it here
                </a>{' '}
                and try again.
              </p>
            )}

            {authStatus === 'authenticated' && isValidGameId && (
              <button
                className={`btn game-details__btn ${inWishlist ? 'btn--primary' : 'btn--secondary'}`}
                onClick={toggle}
                disabled={wishlistLoading}
              >
                {inWishlist ? (
                  <>
                    <HeartStraight weight="bold" />
                    <span>Wishlisted</span>
                  </>
                ) : (
                  <>
                    <Heart weight="bold" />
                    <span>Wishlist</span>
                  </>
                )}
              </button>
            )}

            {!game.commerceEnabled && safeHttpsUrl(game.downloadUrl) && (
              <a
                href={safeHttpsUrl(game.downloadUrl)}
                className="btn btn--secondary game-details__btn"
              >
                <DownloadSimple weight="bold" />
                <span>Download</span>
              </a>
            )}
          </div>

          {screenshots.length > 0 && (
            <div className="game-details__screenshots">
              <h3 className="game-details__screenshots-title">Screenshots</h3>
              <div className="game-details__screenshots-grid">
                {screenshots.map((src, i) => (
                  <div
                    key={i}
                    className="game-details__screenshot-item"
                    onClick={() => openLightbox(i)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openLightbox(i)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open screenshot ${i + 1}`}
                  >
                    <img src={src} alt={`Screenshot ${i + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {labelledVideos.length > 0 && (
            <section className="game-details__videos">
              <h3>Videos</h3>
              <div>
                {labelledVideos.map((video) => <Link to={`/videos/${video.id}`} key={video.id} className="game-video-card">
                  <span className="game-video-card__visual">{safeImageUrl(video.thumbnail) && <img src={safeImageUrl(video.thumbnail)} alt="" loading="lazy" />}<i><Play size={20} weight="bold" /></i></span>
                  <span><small>{video.label}</small><strong>{video.title}</strong></span>
                </Link>)}
              </div>
            </section>
          )}
        </div>

        <aside className="game-details__aside">
          <GameMeta game={game} />
          <div className="game-details__trailer-list">
            {trailerVideos.map((video, index) => <Link to={`/videos/${video.id}`} className="btn btn--primary game-details__trailer" key={video.id}><Play weight="bold" />{trailerVideos.length > 1 ? `Watch trailer ${index + 1}` : 'Watch trailer'}</Link>)}
            {!trailerVideos.length && safeHttpsUrl(game.trailerUrl) && <a href={safeHttpsUrl(game.trailerUrl)} target="_blank" rel="noreferrer" className="btn btn--primary game-details__trailer"><Play weight="bold" />Watch trailer</a>}
          </div>
        </aside>
      </div>

      {game.relatedGames?.length > 0 && (
        <section className="container game-details__related">
          <h2>{t('games.related')}</h2>
          <GameGrid games={game.relatedGames} />
        </section>
      )}
      {game.recommendedGame && (
        <section className="container game-details__related game-details__recommended">
          <h2>Recommended from Deadsmile Games</h2>
          <GameGrid games={[game.recommendedGame]} />
        </section>
      )}

      <Lightbox
        images={screenshots}
        selectedIndex={selectedImageIndex}
        onClose={closeLightbox}
        onPrev={goPrev}
        onNext={goNext}
      />
      <Modal
        open={purchase.open}
        onClose={() => setPurchase((current) => ({ ...current, open: false }))}
        labelledBy="purchase-dialog-title"
      >
        <div className="purchase-dialog">
          <h2 id="purchase-dialog-title">
            {purchase.status === 'connect' && 'Connect your itch.io account'}
            {purchase.status === 'checking' && 'Checking your library'}
            {purchase.status === 'checkout' && 'Complete your purchase'}
            {purchase.status === 'owned' && 'Game verified'}
            {purchase.status === 'error' && 'Verification unavailable'}
          </h2>
          <p>
            {purchase.status === 'connect' && 'Deadsmile Games uses your itch.io account only to verify games you purchased or claimed.'}
            {purchase.status === 'checking' && 'We are securely checking this game against your itch.io library.'}
            {purchase.status === 'checkout' && 'Complete the checkout on itch.io, then return to this tab. Your library will update automatically.'}
            {purchase.status === 'owned' && 'This game is now available in your Deadsmile Games library and launcher.'}
            {purchase.status === 'error' && purchase.message}
          </p>
          <div className="purchase-dialog__actions">
            {purchase.status === 'connect' && <button className="btn btn--primary" onClick={connectItch}>Connect itch.io</button>}
            {purchase.status === 'checkout' && <button className="btn btn--primary" onClick={() => verifyPurchase(false)}>Verify purchase</button>}
            {purchase.status === 'checkout' && safeItchUrl(game.purchaseUrl) && <a className="btn btn--secondary" href={safeItchUrl(game.purchaseUrl)} target="_blank" rel="noreferrer">Open checkout</a>}
            {purchase.status === 'error' && <button className="btn btn--secondary" onClick={() => verifyPurchase(false)}>Try again</button>}
            {purchase.status === 'owned' && (
              <button className="btn btn--primary" onClick={() => { setPurchase((c) => ({ ...c, open: false })); openInLauncher(); }}>
                <GameController weight="bold" />
                Play in Launcher
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
