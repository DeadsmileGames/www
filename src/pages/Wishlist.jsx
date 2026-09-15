import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { GameCard } from '../components/games/GameCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ArrowLeft, HeartStraight } from '@phosphor-icons/react';
import './Wishlist.css';

export function Wishlist() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.get('/wishlist')
      .then((data) => {
        if (!cancelled) {
          const mapped = (Array.isArray(data) ? data : []).map(game => ({
            ...game,
            coverImage: game.cover_image || game.coverImage || game.heroImage,
          }));
          setGames(mapped);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Unable to load wishlist.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => load(), [load]);

  useEffect(() => {
    const onLive = (event) => {
      if (event.detail?.event_type === 'wishlist.updated') load();
    };
    window.addEventListener('deadsmile:live', onLive);
    return () => window.removeEventListener('deadsmile:live', onLive);
  }, [load]);

  if (loading) {
    return (
      <div className="wishlist-page container">
        <Link to="/" className="back-link">
          <ArrowLeft weight="bold" />
          <span>Back</span>
        </Link>
        <h1>Your Wishlist</h1>
        <p className="wishlist-page__intro">Loading your saved games...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page container">
        <Link to="/" className="back-link">
          <ArrowLeft weight="bold" />
          <span>Back</span>
        </Link>
        <h1>Your Wishlist</h1>
        <p className="wishlist-page__error">{error}</p>
      </div>
    );
  }

  return (
    <div className="wishlist-page container">
      <Link to="/" className="back-link">
        <ArrowLeft weight="bold" />
        <span>Back</span>
      </Link>

      <div className="wishlist-page__header">
        <h1>Your Wishlist</h1>
        <p className="wishlist-page__intro">
          {games.length === 0
            ? "You haven't added any games yet."
            : `You have ${games.length} game${games.length > 1 ? 's' : ''} in your wishlist.`}
        </p>
      </div>

      {games.length === 0 ? (
        <EmptyState
          title="WISHLIST EMPTY"
          message="Start adding games you're interested in!"
          action={
            <Link to="/games" className="btn btn--primary">
              Browse games
            </Link>
          }
        />
      ) : (
        <div className="wishlist-page__grid">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
