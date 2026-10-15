import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import { hasContentPreference, setOptionalContent } from "../../utils/consent";

export function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(() => !hasContentPreference());
  if (!visible) return null;
  const choose = (allowed) => {
    setOptionalContent(allowed);
    setVisible(false);
  };
  return (
    <div className="cookie-consent" role="region" aria-label={t("Privacy choices")}>
      <div>
        <div>
          <h3>{t("Privacy choices")}</h3>
          <p>{t("Essential session and security cookies stay active so the site can work safely.")}</p>
          <p>{t("Optional YouTube embeds remain blocked unless you allow them. Security verification asks separately before loading.")}</p>
        </div>
        <div className="cookie-consent__actions">
          <button
            type="button"
            className="cookie-consent__btn"
            onClick={() => choose(true)}
          >
            {t("Accept optional content")}
          </button>
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--decline"
            onClick={() => choose(false)}
          >
            {t("Reject optional content")}
          </button>
          <Link to="/privacy" className="btn btn--secondary">
            {t("Manage preferences")}
          </Link>
        </div>
      </div>
    </div>
  );
}
