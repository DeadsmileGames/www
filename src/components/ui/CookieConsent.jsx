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
    <div className="cookie-consent" role="dialog" aria-label={t("Cookie consent")}>
      <div className="cookie-consent__inner">
        <div className="cookie-consent__message">
          <p>
            {t(
              "Allow optional YouTube content? YouTube may receive your IP and use storage. Session and security cookies are essential. Google security verification asks separately before loading.",
            )}
          </p>
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
            {t("Decline optional content")}
          </button>
          <Link to="/privacy" className="cookie-consent__link">
            {t("Manage preferences")}
          </Link>
        </div>
      </div>
    </div>
  );
}
