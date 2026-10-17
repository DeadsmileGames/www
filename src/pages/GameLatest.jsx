import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { AutoLinkText } from "../components/ui/AutoLinkText";
import { useContent } from "../hooks/useContent";
import { safeImageUrl } from "../utils/urls";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonVideos } from "../components/ui/Skeleton";

export function GameLatest() {
  const { slug = "" } = useParams();
  const { t, language } = useLanguage();
  const encodedSlug = encodeURIComponent(slug);
  const game = useContent(`/games/${encodedSlug}`);
  const latest = useContent(`/games/${encodedSlug}/latest`, { limit: 24 });
  const items = Array.isArray(latest.data) ? latest.data : [];

  if (game.status === "error") {
    return (
      <div className="game-latest-page container">
        
        <ErrorState message={game.error} onRetry={game.retry} />
      </div>
    );
  }

  return (
    <div className="game-latest-page container">
      <Link to={`/games/${encodedSlug}`} className="back-link">
        <ArrowLeft weight="bold" />
        <span>{t("Back to game")}</span>
      </Link>

      <header className="game-latest-page__header">
        <h1>{t("Latest updates for {0}", { 0: game.data?.title || slug })}</h1>
        <p>{t("News and updates about this game.")}</p>
      </header>

      {latest.status === "error" && (
        <ErrorState message={latest.error} onRetry={latest.retry} />
      )}
      {latest.status === "loading" && <SkeletonVideos />}
      {latest.status === "success" && items.length === 0 && (
        <p className="content-state">{t("No recent updates for this game.")}</p>
      )}
      {latest.status === "success" && items.length > 0 && (
        <div className="game-latest-page__grid">
          {items.map((item) => {
            const image = safeImageUrl(item.image);
            const publishedAt = item.published_at;
            return (
              <article className="game-latest-page__card" key={item.id}>
                <Link
                  className="game-latest-page__image"
                  to={`/newswire/${encodeURIComponent(item.slug)}`}
                  aria-label={item.title}
                >
                  {image && <img src={image} alt="" loading="lazy" />}
                </Link>
                <div className="game-latest-page__copy">
                  {publishedAt && Number.isFinite(Date.parse(publishedAt)) && (
                    <time dateTime={publishedAt}>
                      {new Date(publishedAt).toLocaleDateString(language, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                  )}
                  <h2>
                    <Link to={`/newswire/${encodeURIComponent(item.slug)}`}>
                      {item.title}
                    </Link>
                  </h2>
                  {item.excerpt && <p><AutoLinkText>{item.excerpt}</AutoLinkText></p>}
                  <Link
                    to={`/newswire/${encodeURIComponent(item.slug)}`}
                    className="game-latest-page__read-more"
                  >
                    {t("Read update")}
                    <ArrowUpRight weight="bold" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
