import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { safeImageUrl } from "../../utils/urls";

export function GameCoverPanel({ game, cover, children }) {
  const { t } = useLanguage();
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
        <p>{description}</p>
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
