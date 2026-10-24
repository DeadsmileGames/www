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
          {t("This page explains the cookies, browser storage and external resources currently used by the Deadsmile Games website.")}
        </p>
      </Reveal>
      <section className="privacy-page__content">
        <div className="privacy-block">
          <h2>{t("1. Essential session and local storage")}</h2>
          <p>{t("The site uses a session cookie to keep you signed in and protect account requests. It also uses local storage for language preference, optional-content preference and limited interface state. These technologies support site functionality and are not used to build advertising profiles.")}</p>
        </div>
        <div className="privacy-block">
          <h2>{t("2. Optional videos and security verification")}</h2>
          <p>{t("The optional-content setting currently controls embedded YouTube players. You can accept or reject optional content below or from the privacy page. Some YouTube thumbnail images or media requests may be separate from the embedded player, so blocking the player does not by itself prove that every YouTube request is blocked before consent; the live network behavior must be checked.")}</p>
          <p>{t("Google reCAPTCHA is offered separately on protected forms and is loaded only after you choose to load security verification. That choice is separate from the optional YouTube-content setting.")}</p>
          <button type="button" className="btn btn--secondary" onClick={changePreference}>
            {t(optionalAllowed ? "Reject optional content" : "Accept optional content")}
          </button>
          {updated && <p role="status">{t("Your privacy preferences have been saved.")}</p>}
        </div>
        <div className="privacy-block">
          <h2>{t("3. External font and provider requests")}</h2>
          <p>{t("The site currently requests the Poppins typeface from Google Fonts. Those requests may reach Google before you choose optional content. Deadsmile Games intends to self-host the font files, but that change must be verified in the production site before this disclosure is removed.")}</p>
          <p>{t("When you load or interact with third-party services, including YouTube, Google reCAPTCHA or a connected itch.io account, those providers may receive technical information such as your IP address, browser metadata and the request you made. Their own privacy notices apply to processing they carry out for their own purposes.")}</p>
        </div>
        <div className="privacy-block">
          <h2>{t("4. Scope of this preference")}</h2>
          <p>{t("This preference control currently covers optional YouTube embedded players; it is not a full preference manager for every storage item or external request used by the site. Essential session functionality remains active when required for sign-in and security. The separate reCAPTCHA choice appears on protected forms.")}</p>
        </div>
        <div className="privacy-block">
          <h2>{t("5. Contact and related information")}</h2>
          <p>{t("For questions about privacy or these technologies, contact")} <a href="mailto:somiarigames@gmail.com">somiarigames@gmail.com</a>. {t("See also the Privacy Policy for information about data processing and privacy rights.")}</p>
        </div>
        <p className="terms-page__date">
          <small>{t("Last updated: October 24, 2026")}</small>
          <small>{t("Document version: cookies-v2026-10-24")}</small>
        </p>
      </section>
    </div>
  );
}
