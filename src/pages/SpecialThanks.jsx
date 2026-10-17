import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { api, friendlyErrorMessage } from "../services/api";
import { CursorTrail } from "../components/ui/CursorTrail";

export function SpecialThanks() {
  const { t } = useLanguage();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

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

  return (
    <div className="special-thanks-page container" aria-busy={loading}>
      <CursorTrail />
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
    </div>
  );
}
