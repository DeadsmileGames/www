import { GameCard } from "./GameCard";
import { useMicrosoftStoreCovers } from "../../hooks/useMicrosoftStoreCovers";

export function GameGrid({ games }) {
  const storeCovers = useMicrosoftStoreCovers(games);
  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} cover={storeCovers[String(game.id ?? game.slug)]} />
      ))}
    </div>
  );
}
