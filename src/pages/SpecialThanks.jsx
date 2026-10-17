import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { api, friendlyErrorMessage } from "../services/api";
import { CursorTrail } from "../components/ui/CursorTrail";

export function SpecialThanks() {
  const { t, language, setLanguage } = useLanguage();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api
      .get("/special-thanks")
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : [];
        setPeople(
          list.filter((person) => person && typeof person.name === "string" && person.name.trim()),
        );
      })
      .catch((failure) => {
        if (active) setError(friendlyErrorMessage(failure));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [revision]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!languageRef.current?.contains(event.target)) setLanguageOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape" || !languageOpen) return;
      setLanguageOpen(false);
      languageRef.current?.querySelector("button")?.focus();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [languageOpen]);

  return (
    <div className="special-thanks-page container" aria-busy={loading}>
      <CursorTrail />

      <nav className="special-thanks-page__toolbar" aria-label={t("Page controls")}>
        <div className="site-header__account-wrap" ref={languageRef}>
          <button
            type="button"
            className="site-header__account-pill special-thanks-page__language-trigger"
            onClick={() => setLanguageOpen((open) => !open)}
            aria-expanded={languageOpen}
            aria-label={t("Change language")}
          >
            <Globe size={21} weight="bold" aria-hidden="true" />
            <span>{t("Language")}</span>
          </button>
          {languageOpen && (
            <div
              className="site-header__dropdown special-thanks-page__language-menu"
              role="menu"
              aria-label={t("Language")}
            >
              {[
                ["en", "English"],
                ["es", "Español"],
                ["pt-BR", "Português (Brasil)"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={language === value}
                  key={value}
                  dir="ltr"
                  onClick={() => {
                    setLanguage(value);
                    setLanguageOpen(false);
                  }}
                >
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <header className="special-thanks-page__header">
        <h1 className="special-thanks-page__title">{t("Thank you!")}</h1>
        <h2 className="special-thanks-page__subtitle">{t("Special thanks to")}</h2>
      </header>

      {loading ? (
        <p className="special-thanks-page__status" role="status">
          {t("Loading names…")}
        </p>
      ) : error ? (
        <div className="special-thanks-page__status" role="alert">
          <p>{t(error)}</p>
          <button
            type="button"
            className="special-thanks-page__retry"
            onClick={() => setRevision((value) => value + 1)}
          >
            {t("Try again")}
          </button>
        </div>
      ) : people.length ? (
        <ul className="special-thanks-page__list" aria-label={t("Special thanks names")}>
          {people.map((person) => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
      ) : (
        <p className="special-thanks-page__status">
          {t("The list is waiting for its first names.")}
        </p>
      )}

      <p className="special-thanks-page__intro">
        {t("A big thank-you to the people who have supported and inspired us.")}
      </p>

      <Link to="/" className="special-thanks-page__back">
        {t("Back to home")}
      </Link>
    </div>
  );
}
