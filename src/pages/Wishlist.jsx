import {
  useLanguage } from "../context/LanguageContext";
import { useCallback,
  useEffect,
  useRef,
  useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api,
  friendlyErrorMessage } from "../services/api";
import { SkeletonGameGrid } from "../components/ui/Skeleton";
import { GameCoverPanel } from "../components/games/GameCoverPanel";
import { safeImageUrl } from "../utils/urls";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ArrowLeft,
} from "@phosphor-icons/react";
import { useMicrosoftStoreCovers } from "../hooks/useMicrosoftStoreCovers";

export function Wishlist() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const storeCovers = useMicrosoftStoreCovers(games, { includeUnknown: true });

  const load = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");

    api
      .get("/wishlist")
      .then((data) => {
        if (id === requestId.current) {
          const mapped = (Array.isArray(data) ? data : []).map((game) => ({
            ...game,
            coverImage: game.cover_image || game.coverImage || game.heroImage,
          }));
          setGames(mapped);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (id === requestId.current) {
          setError(friendlyErrorMessage(err));
          setLoading(false);
        }
      });

    return () => {
      requestId.current += 1;
    };
  }, [language, user?.id]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    const onLive = (event) => {
      if (
        event.detail?.event_type === "wishlist.updated" ||
        /^game\.(published|updated|deleted)$/.test(event.detail?.event_type || "")
      )
        load();
    };
    window.addEventListener("deadsmile:live", onLive);
    return () => window.removeEventListener("deadsmile:live", onLive);
  }, [load]);

  if (loading) {
    return (
      <div className="wishlist-page container">
        
        <h1>{t("Your Wishlist")}</h1>
        <SkeletonGameGrid count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page container">
        
        <h1>{t("Your Wishlist")}</h1>
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="wishlist-page container">
      

      <div className="wishlist-page__header">
        <h1>{t("Your Wishlist")}</h1>
        <p className="wishlist-page__intro">
          {games.length === 0
            ? t("You haven't added any games yet.")
            : t("You have {0} game{1} in your wishlist.", {
                0: games.length,
                1: games.length > 1 ? "s" : "",
              })}
        </p>
      </div>

      {games.length === 0 ? (
        <EmptyState
          title={t("WISHLIST EMPTY")}
          message={t("Start adding games you're interested in!")}
          action={
            <Link to="/games" className="btn btn--primary">
              {t("Browse games")}
            </Link>
          }
        />
      ) : (
        <div className="library-page__grid game-cover-tile-grid">
          {games.map((game) => (
            <GameCoverPanel
              key={game.id}
              game={game}
              cover={storeCovers[String(game.id ?? game.slug)] || safeImageUrl(game.coverImage || game.cover_image || game.heroImage)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
