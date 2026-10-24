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
      <div className="cookie-consent__inner">
        <div className="cookie-consent__message">
          <h3>{t("Privacy choices")}</h3>
          <p>{t("Essential session and security cookies stay active so the site can work safely.")}</p>
          <p>{t("Externally hosted video thumbnails, YouTube embedded players and read-only live chat remain unavailable until you allow optional content. Security verification asks separately before loading.")}</p>
        </div>
        <div className="cookie-consent__actions">
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--accept"
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
          <Link to="/cookies" className="cookie-consent__link">
            {t("Manage preferences")}
          </Link>
        </div>
      </div>
    </div>
  );
}
