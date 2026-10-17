import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { safeImageUrl } from "../../utils/urls";
import { AutoLinkText } from "../ui/AutoLinkText";
import { getReleaseTimestamp } from "../../utils/releaseDate";
import { useServerClock } from "../../hooks/useServerClock";

export function GameCoverPanel({ game, cover, children }) {
  const { t } = useLanguage();
  const clockNow = useServerClock();
  const releaseTimestamp = getReleaseTimestamp(game.releaseDate || game.release_date || "");
  const releaseReached = clockNow !== null && Number.isFinite(releaseTimestamp) && releaseTimestamp <= clockNow;
  const preorderLocked = Boolean(
    game.preorderLocked &&
    game.status !== "released" &&
    !(game.status === "in_development" && releaseReached)
  );
  const releaseCountdownAvailable =
    clockNow !== null && preorderLocked && Number.isFinite(releaseTimestamp) && releaseTimestamp > clockNow;
  const remaining = releaseCountdownAvailable ? Math.max(0, releaseTimestamp - clockNow) : 0;
  const countdown = [Math.floor(remaining / 86400000), Math.floor((remaining % 86400000) / 3600000), Math.floor((remaining % 3600000) / 60000), Math.floor((remaining % 60000) / 1000)];
  const image = safeImageUrl(cover || game.coverImage || game.cover_image || game.heroImage);
  const slug = game.slug || game.id;
  const description =
    game.shortDescription ||
    game.short_description ||
    game.description ||
    t("No description available.");

  return (
    <article className="library-cover game-cover-tile">
      <Link
        to={`/games/${encodeURIComponent(slug)}`}
        className="library-cover__link"
        aria-label={t("View game") + ": " + game.title}
      >
        <img
          className="library-cover__image"
          src={image || "/assets/placeholders/game-cover.svg"}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/assets/placeholders/game-cover.svg";
          }}
        />
        <span className="library-cover__title">{game.title}</span>
      </Link>
      <div className="game-cover-tile__panel">
        <h2>{game.title}</h2>
        <p><AutoLinkText>{description}</AutoLinkText></p>
        {preorderLocked && (
          <div role="status" style={{ margin: "12px 0", padding: "12px", border: "1px solid var(--color-border)", borderRadius: "8px", background: "var(--color-background-alt)" }}>
            <strong>{t("Pre-order reserved")}</strong>
            {releaseCountdownAvailable ? (
              <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)" }}>{t("Download unlocks in")} {countdown[0]}d {String(countdown[1]).padStart(2, "0")}h {String(countdown[2]).padStart(2, "0")}m {String(countdown[3]).padStart(2, "0")}s</p>
            ) : (
              <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)" }}>{clockNow === null ? t("Syncing official time…") : t("Download becomes available when the game is released.")}</p>
            )}
          </div>
        )}
        <div className="game-cover-tile__actions">
          <Link
            to={`/games/${encodeURIComponent(slug)}`}
            className="btn btn--primary"
          >
            {t("View game")}
          </Link>
          <Link
            to={`/games/${encodeURIComponent(slug)}/latest`}
            className="btn btn--secondary"
          >
            {t("Latest news")}
          </Link>
        </div>
      </div>
      {children}
    </article>
  );
}
