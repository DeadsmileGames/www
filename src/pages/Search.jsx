import { useRef, useState } from "react";
import { useSearch } from "../hooks/useSearch";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonSearch } from "../components/ui/Skeleton";
import { SearchResults } from "../components/search/SearchResults";
import { X } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";

export function Search() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const { status, results, retry, error } = useSearch(query);

  return (
    <div className="search-page container">
      

      <h1>{t("nav.search")}</h1>

      <div className="search-page__input-wrapper">
        <label htmlFor="search-page-input" className="sr-only">
          {t("Site search")}
        </label>
        <input
          ref={inputRef}
          id="search-page-input"
          type="search"
          className="search-page__input"
          placeholder={t("Search Deadsmile Games…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          maxLength={80}
        />
        {query && (
          <button
            type="button"
            className="search-page__clear"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label={t("Clear search")}
            title={t("Clear search")}
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="search-page__results">
        {status === "idle" && (
          <p className="search-page__hint">
            {t("Start typing to search games, news, and videos.")}
          </p>
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
          <SearchResults results={results} variant="page" />
        )}
      </div>
    </div>
  );
}
