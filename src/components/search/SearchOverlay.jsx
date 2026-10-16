import { useLanguage } from "../../context/LanguageContext";
import { AutoLinkText } from "../ui/AutoLinkText";
import { SkeletonSearch } from "../ui/Skeleton";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSearch } from "../../hooks/useSearch";
import { useMicrosoftStoreCovers } from "../../hooks/useMicrosoftStoreCovers";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { trapFocus } from "../../utils/dom";
import { safeImageUrl } from "../../utils/urls";

export function SearchOverlay({ open, onClose, hasPremiere = false }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const { status, results, retry, error } = useSearch(open ? query : "");
  const storeCovers = useMicrosoftStoreCovers(results, { includeUnknown: true });

  useEffect(() => {
    if (!open) return;
    return trapFocus(panelRef.current, () => closeRef.current(), inputRef.current);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      const search = document.querySelector(".search-overlay");

      if (search && !search.contains(event.target)) {
        closeRef.current();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`search-overlay${hasPremiere ? " search-overlay--with-banner" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={t("Site search")}
      ref={panelRef}
      tabIndex={-1}
    >
      <div className="search-overlay__inner">
        <div className="search-overlay__bar">
          <MagnifyingGlass weight="bold" size={24} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search Deadsmile Games\u2026")}
            className="search-overlay__input"
            aria-label={t("Search games")}
            maxLength={80}
          />
        </div>
        <button
          type="button"
          className="search-overlay__close"
          onClick={onClose}
          aria-label={t("Close search")}
        >
          <X weight="bold" />
        </button>
      </div>

      <div className="search-overlay__results">
        {status === "idle" && (
          <p className="search-overlay__hint">{t("Start typing to find a game.")}</p>
        )}

        {status === "loading" && <SkeletonSearch />}

        {status === "error" && (
          <ErrorState title={t("SEARCH FAILED")} message={t(error)} onRetry={retry} />
        )}

        {status === "success" && results.length === 0 && (
          <EmptyState
            title={t("NO RESULTS")}
            message={t('Nothing matched "{0}".', { 0: query })}
          />
        )}

        {status === "success" && results.length > 0 && (
          <ul className="search-overlay__list">
            {results.map((game) => (
              <li key={game.id}>
                <Link
                  to={`/games/${game.slug}`}
                  onClick={onClose}
                  className="search-overlay__result"
                >
                  <img
                    src={
                      safeImageUrl(storeCovers[String(game.id ?? game.slug)]) ||
                      safeImageUrl(game.coverImage) ||
                      "/assets/placeholders/game-cover.svg"
                    }
                    alt=""
                    className="search-overlay__thumb"
                  />

                  <div>
                    <p className="search-overlay__result-title">{game.title}</p>
                    <p className="search-overlay__result-desc"><AutoLinkText>{game.shortDescription}</AutoLinkText></p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
