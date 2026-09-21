import { useState } from "react";
import { Link } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonGameGrid } from "../components/ui/Skeleton";
import { GameGrid } from "../components/games/GameGrid";
import { ArrowLeft } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";

export function Search() {
    const { t } = useLanguage();
    const [query, setQuery] = useState("");
    const { status, results, retry } = useSearch(query);

    const games = results.map((r) => ({ ...r, coverImage: r.coverImage }));

    return (
        <div className="search-page container">
            <Link to="/" className="back-link">
                <ArrowLeft weight="bold" />
                <span>Back</span>
            </Link>
            
            <h1>{t("nav.search")}</h1>
            
            <div className="search-page__input-wrapper">
                <label htmlFor="search-page-input" className="sr-only">
                    Search games
                </label>
                <input
                    id="search-page-input"
                    type="search"
                    className="search-page__input"
                    placeholder="Search Deadsmile Games…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    maxLength={80}
                />
            </div>

            <div className="search-page__results">
                {status === "idle" && (
                    <p className="search-page__hint">
                        Start typing to find a game.
                    </p>
                )}
                {status === "loading" && <SkeletonGameGrid count={6} />}
                {status === "error" && (
                    <ErrorState title="SEARCH FAILED" onRetry={retry} />
                )}
                {status === "success" && games.length === 0 && (
                    <EmptyState
                        title="NO RESULTS"
                        message={`Nothing matched "${query}".`}
                        action={
                            <Link to="/games" className="btn btn--secondary">
                                Browse all games
                            </Link>
                        }
                    />
                )}
                {status === "success" && games.length > 0 && (
                    <GameGrid games={games} />
                )}
            </div>
        </div>
    );
}