import { GameCard } from './GameCard';
import './GameGrid.css';

export function GameGrid({ games }) {
  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
