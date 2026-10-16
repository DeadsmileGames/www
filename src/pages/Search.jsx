import { useState } from "react";
import { Link } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonSearch } from "../components/ui/Skeleton";
import { SearchResults } from "../components/search/SearchResults";
import { ArrowLeft } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";

export function Search() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const { status, results, retry, error } = useSearch(query);

  return (
    <div className="search-page container">
      <Link to="/" className="back-link">
        <ArrowLeft weight="bold" />
        <span>{t("Back")}</span>
      </Link>

      <h1>{t("nav.search")}</h1>

      <div className="search-page__input-wrapper">
        <label htmlFor="search-page-input" className="sr-only">
          {t("Site search")}
        </label>
        <input
          id="search-page-input"
          type="search"
          className="search-page__input"
          placeholder={t("Search Deadsmile Games…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          maxLength={80}
        />
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
