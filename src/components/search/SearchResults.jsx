import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useMicrosoftStoreCovers } from "../../hooks/useMicrosoftStoreCovers";
import { getVideoThumbnail } from "../../utils/videoThumbnail";
import { safeImageUrl } from "../../utils/urls";
import { AutoLinkText } from "../ui/AutoLinkText";

function resultPath(item) {
  if (item.type === "game") return "/games/" + encodeURIComponent(item.slug);
  if (item.type === "news") return "/newswire/" + encodeURIComponent(item.slug);
  return "/videos?video=" + encodeURIComponent(item.id);
}

function resultTypeLabel(type, t) {
  if (type === "game") return t("Games");
  if (type === "news") return t("News");
  return t("Videos");
}

export function SearchResults({ results, variant = "overlay", onResultClick }) {
  const { t, language } = useLanguage();
  const games = useMemo(
    () => results.filter((result) => result.type === "game"),
    [results],
  );
  const storeCovers = useMicrosoftStoreCovers(games, { includeUnknown: true });
  const listClassName =
    variant === "page"
      ? "search-overlay__list search-page__list"
      : "search-overlay__list";

  return (
    <ul className={listClassName}>
      {results.map((item) => {
        const href = resultPath(item);
        const image =
          item.type === "game"
            ? safeImageUrl(storeCovers[String(item.id ?? item.slug)]) ||
              safeImageUrl(item.coverImage || item.image) ||
              "/assets/placeholders/game-cover.svg"
            : item.type === "video"
              ? getVideoThumbnail(item, language) ||
                safeImageUrl(item.image) ||
                "/assets/games/screenshots/light/1.png"
              : safeImageUrl(item.image) ||
                "/assets/games/screenshots/light/1.png";
        const description = item.description || item.shortDescription || item.excerpt || "";

        return (
          <li key={item.type + ":" + item.id}>
            <div className="search-overlay__result">
              <Link
                to={href}
                onClick={onResultClick}
                className="search-overlay__result-cover"
                aria-label={t("View {0}", { 0: item.title })}
              >
                <img
                  src={image}
                  alt=""
                  className="search-overlay__thumb"
                  loading="lazy"
                />
              </Link>

              <div className="search-overlay__result-copy">
                <span className="search-result-type">
                  {resultTypeLabel(item.type, t)}
                </span>
                <Link
                  to={href}
                  onClick={onResultClick}
                  className="search-overlay__result-title-link"
                >
                  <p className="search-overlay__result-title">{item.title}</p>
                </Link>
                {description && (
                  <p className="search-overlay__result-desc">
                    <AutoLinkText>{description}</AutoLinkText>
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
