import { GameCard } from "./GameCard";
import { GameCoverPanel } from "./GameCoverPanel";
import { useMicrosoftStoreCovers } from "../../hooks/useMicrosoftStoreCovers";

export function GameGrid({ games, variant = "card" }) {
  const coverLayout = variant === "cover";
  const storeCovers = useMicrosoftStoreCovers(games, {
    includeUnknown: coverLayout,
  });

  return (
    <div className={coverLayout ? "library-page__grid game-cover-tile-grid" : "game-grid"}>
      {games.map((game) =>
        coverLayout ? (
          <GameCoverPanel
            key={game.id ?? game.slug}
            game={game}
            cover={
              storeCovers[String(game.id ?? game.slug)] ||
              game.coverImage ||
              game.cover_image ||
              game.heroImage ||
              game.hero_image
            }
          />
        ) : (
          <GameCard
            key={game.id ?? game.slug}
            game={game}
            cover={storeCovers[String(game.id ?? game.slug)]}
          />
        ),
      )}
    </div>
  );
}
