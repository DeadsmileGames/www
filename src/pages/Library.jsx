import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, X } from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { api, friendlyErrorMessage } from "../services/api";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonGameGrid } from "../components/ui/Skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { safeImageUrl } from "../utils/urls";

function storePosterFromDetails(details) {
  const images = Array.isArray(details?.microsoftStore?.images)
    ? details.microsoftStore.images
    : [];
  const candidates = images
    .filter((image) =>
      typeof image?.url === "string" &&
      /poster|boxart|cover/i.test(image?.purpose || ""),
    )
    .sort((a, b) => {
      const aPortrait = Number(a.height || 0) > Number(a.width || 0) ? 1 : 0;
      const bPortrait = Number(b.height || 0) > Number(b.width || 0) ? 1 : 0;
      return bPortrait - aPortrait || Number(b.height || 0) - Number(a.height || 0);
    });
  return candidates.map((image) => safeImageUrl(image.url)).find(Boolean) || null;
}

// Match the Launcher: fetch Store artwork only for products carrying its Store badge.
async function loadStorePosters(games) {
  const candidates = games.filter((game) => game.microsoftStoreBadge && game.slug);
  const posters = new Map();
  let next = 0;
  const workers = Array.from({ length: Math.min(4, candidates.length) }, async () => {
    while (next < candidates.length) {
      const game = candidates[next++];
      try {
        const details = await api.get(`/games/${encodeURIComponent(game.slug)}`);
        if (String(details?.id || "") !== String(game.id)) continue;
        const poster = storePosterFromDetails(details);
        if (poster) posters.set(String(game.id), poster);
      } catch {
        // Store artwork is optional. The database cover remains the fallback.
      }
    }
  });
  await Promise.all(workers);
  return posters;
}

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
      // This existing catalog endpoint reports library membership from user entitlements.
      const items = Array.isArray(data?.items)
        ? data.items.filter((game) => game.inLibrary === true)
        : [];
      const normalizedItems = items.map((game) => ({
        ...game,
        coverImage: game.coverImage || game.cover_image || game.heroImage || game.hero_image,
      }));
      setGames(normalizedItems);

      // Show database covers immediately, then replace them with Store posters when available.
      void loadStorePosters(normalizedItems).then((posters) => {
        if (id !== requestId.current || posters.size === 0) return;
        setGames((current) =>
          current.map((game) => {
            const poster = posters.get(String(game.id));
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
      <Link to="/" className="back-link">
        <ArrowLeft weight="bold" />
        <span>{t("Back")}</span>
      </Link>

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
              <article className="library-cover" key={game.id}>
                <Link
                  to={`/games/${encodeURIComponent(game.slug)}`}
                  className="library-cover__link"
                  aria-label={t("View game") + ": " + game.title}
                >
                  <img
                    className="library-cover__image"
                    src={cover || "/assets/placeholders/game-cover.svg"}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        databaseCover && cover !== databaseCover
                          ? databaseCover
                          : "/assets/placeholders/game-cover.svg";
                    }}
                  />
                  <span className="library-cover__title">{game.title}</span>
                </Link>
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
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
