import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useOptionalContent, setOptionalContent } from "../utils/consent";
import { Reveal } from "../components/ui/Reveal";

export function Cookies() {
  const { t } = useLanguage();
  const optionalAllowed = useOptionalContent();
  const [updated, setUpdated] = useState(false);

  function changePreference() {
    setOptionalContent(!optionalAllowed);
    setUpdated(true);
  }

  return (
    <div className="privacy-page container">
      <Reveal>
        <h1>{t("Cookie Policy")}</h1>
        <p className="privacy-page__intro">
          {t("A brief guide to browser storage and optional content on this site.")}
        </p>
      </Reveal>
      <section className="privacy-page__content">
        <div className="privacy-block">
          <h2>{t("Essential storage")}</h2>
          <p>
            {t("A session cookie keeps you signed in. Local storage remembers your language and content preference. Essential sign-in and security functions remain active when needed.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("Optional content")}</h2>
          <p>
            {t("Externally hosted video thumbnails, YouTube players and read-only live chat are blocked until you allow optional content. Google reCAPTCHA is requested separately on protected forms. Poppins fonts are hosted on this site.")}
          </p>
          <button type="button" className="btn btn--secondary" onClick={changePreference}>
            {t(optionalAllowed ? "Reject optional content" : "Accept optional content")}
          </button>
          {updated && <p role="status">{t("Your privacy preferences have been saved.")}</p>}
        </div>

        <div className="privacy-block">
          <h2>{t("External services")}</h2>
          <p>
            {t("When you load or connect to third-party services, they may receive technical data such as your IP address, browser information and the request made. See the")}{" "}
            <a href="/privacy">{t("Privacy Policy")}</a>
            {t(" for details and contact")}{" "}
            <a href="mailto:somiarigames@gmail.com">somiarigames@gmail.com</a>
            {t(" with questions.")}
          </p>
        </div>

        <p className="terms-page__date">
          <small>{t("Last updated: October 25, 2026")}</small>
          <small>{t("Document version: cookies-v2026-10-25")}</small>
        </p>
      </section>
    </div>
  );
}
