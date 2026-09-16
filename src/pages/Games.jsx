import { useState } from "react";
import { useGames } from "../hooks/useGames";
import { GameGrid } from "../components/games/GameGrid";
import { SkeletonGameGrid } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { ArrowLeft } from "@phosphor-icons/react";
import { Reveal } from "../components/ui/Reveal";
import "./Games.css";

const PAGE_SIZE = 12;

export function Games() {
    const { t } = useLanguage();
    const [page, setPage] = useState(1);
    const { status, games, pagination, error, retry } = useGames({
        page,
        limit: PAGE_SIZE,
    });

    return (
        <div className="games-page container">
            <Link to="/" className="back-link">
               <ArrowLeft weight="bold" />
                <span>Back</span>
            </Link>
            <Reveal>
                <header className="games-page__head">
                    <h1>{t("games.title")}</h1>
                    <p>{t("games.intro")}</p>
                </header>
            </Reveal>

            {status === "loading" && <SkeletonGameGrid count={PAGE_SIZE} />}
            {status === "error" && (
                <ErrorState message={error} onRetry={retry} />
            )}
            {status === "success" && games.length === 0 && <EmptyState />}
            {status === "success" && games.length > 0 && (
                <>
                    <GameGrid games={games} />
                    {pagination && pagination.totalPages > 1 && (
                        <div className="games-page__pagination">
                            <Button
                                variant="secondary"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                {t("games.previous")}
                            </Button>
                            <span>
                                {t("games.page")} {pagination.page} /{" "}
                                {pagination.totalPages}
                            </span>
                            <Button
                                variant="secondary"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                {t("games.next")}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
