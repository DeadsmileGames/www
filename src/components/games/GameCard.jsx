import { Link } from 'react-router-dom';
import { safeImageUrl } from '../../utils/urls';

export function GameCard({ game }) {
  return (
    <Link to={`/games/${game.slug}`} className="game-card">
      <div className="game-card__image-wrap">
        <img
          src={safeImageUrl(game.coverImage) || '/assets/placeholders/game-cover.svg'}
          alt=""
          className="game-card__image"
          loading="lazy"
        />
        {game.status && game.status !== 'released' && (
          <span className="game-card__badge">{game.status.replace('_', ' ')}</span>
        )}
      </div>
      <h3 className="game-card__title">{game.title}</h3>
      {game.genres?.length > 0 && (
        <p className="game-card__meta">{game.genres.join(' · ')}</p>
      )}
    </Link>
  );
}
