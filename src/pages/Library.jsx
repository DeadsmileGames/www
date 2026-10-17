import {
  useCallback,
  useEffect,
  useRef,
  useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { api, friendlyErrorMessage } from "../services/api";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonGameGrid } from "../components/ui/Skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { safeImageUrl } from "../utils/urls";
import { GameCoverPanel } from "../components/games/GameCoverPanel";
import { loadMicrosoftStoreCovers } from "../utils/microsoftStoreCover";

export function Library() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");

    try {
      const data = await api.get("/library/catalog");
      if (id !== requestId.current) return;
      
      const items = Array.isArray(data?.items)
        ? data.items.filter((game) => game.inLibrary === true)
        : [];
      const normalizedItems = items.map((game) => ({
        ...game,
        coverImage: game.coverImage || game.cover_image || game.heroImage || game.hero_image,
      }));
      setGames(normalizedItems);

      
      void loadMicrosoftStoreCovers(normalizedItems).then((posters) => {
        if (id !== requestId.current || posters.size === 0) return;
        setGames((current) =>
          current.map((game) => {
            const poster = posters.get(String(game.id ?? game.slug));
            return poster ? { ...game, storePoster: poster } : game;
          }),
        );
      });
    } catch (err) {
      if (id === requestId.current) setError(friendlyErrorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [language, user?.id]);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  async function removeGame(game) {
    if (removingId) return;
    setRemovingId(game.id);
    setError("");
    try {
      await api.delete(`/library/${encodeURIComponent(game.id)}`);
      setGames((current) => current.filter((item) => item.id !== game.id));
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="library-page container">
      

      <header className="library-page__header">
        <div>
          <h1>{t("Your library")}</h1>
          <p>{t("Your games, all in one place.")}</p>
        </div>
        {!loading && !error && games.length > 0 && (
          <p className="library-page__count">
            {t("You have {0} games in your library.", { 0: games.length })}
          </p>
        )}
      </header>

      {error && (
        <div className="library-page__error" role="alert">
          <ErrorState message={error} onRetry={load} />
        </div>
      )}

      {loading ? (
        <SkeletonGameGrid count={6} />
      ) : !error && games.length === 0 ? (
        <EmptyState
          title={t("No games in your library yet.")}
          message={t("Add games to your library to keep them handy.")}
          action={
            <Link to="/games" className="btn btn--primary">
              {t("Browse games")}
            </Link>
          }
        />
      ) : games.length > 0 ? (
        <div className="library-page__grid">
          {games.map((game) => {
            const databaseCover = safeImageUrl(game.coverImage);
            const cover = safeImageUrl(game.storePoster) || databaseCover;
            const busy = removingId === game.id;
            return (
              <GameCoverPanel key={game.id} game={game} cover={cover || databaseCover}>
                <button
                  type="button"
                  className="library-cover__remove"
                  onClick={() => removeGame(game)}
                  disabled={Boolean(removingId)}
                  aria-busy={busy}
                  aria-label={t("Remove from library") + ": " + game.title}
                  title={t("Remove from library")}
                >
                  {busy ? <LoadingSpinner className="loading-spinner--icon" /> : <X size={17} weight="bold" aria-hidden="true" />}
                </button>
              </GameCoverPanel>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
