import { useLanguage } from "../context/LanguageContext";
import { useOptionalContent, setOptionalContent } from "../utils/consent";
import { Reveal } from "../components/ui/Reveal";

export function Privacy() {
  const { t } = useLanguage();
  const optionalAllowed = useOptionalContent();

  return (
    <div className="privacy-page container">
      <Reveal>
        <h1>{t("Privacy Policy")}</h1>
        <p className="privacy-page__intro">
          {t("How Deadsmile Games uses personal data on this website and its account features.")}
        </p>
      </Reveal>
      <section className="privacy-page__content">
        <div className="privacy-block">
          <h2>{t("Controller and contact")}</h2>
          <p>
            {t("The controller is Lucas Eduardo Duarte Pereira, operating as Deadsmile Games in São Paulo, Brazil. For privacy requests, contact")}{" "}
            <a href="mailto:somiarigames@gmail.com">somiarigames@gmail.com</a>.
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("Data we use")}</h2>
          <p>
            {t("Depending on the features you use, we process account details (username, email, date of birth, password hash and security/session records); profile fields and game activity you choose to share; free-game registration details (first name, last name, self-reported age and email); newsletter email and subscription records; support messages; cloud-save data for supported games; and technical data needed to operate and protect the service. We also record the versions of the Terms and Privacy Policy, language and acceptance time when you register.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("Why we use data")}</h2>
          <p>
            {t("We use data to provide accounts, profiles, libraries and supported cloud saves; manage free-game registrations and the newsletter; respond to support requests; secure the service; and comply with the law. Depending on the activity, the legal basis may be contract or pre-contract steps, consent, legitimate interests balanced against your rights, or a legal obligation.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("Service providers and transfers")}</h2>
          <p>
            {t("We do not sell personal data. The providers used for hosting and databases (Render and Neon), email (Brevo and, when configured, Resend), security checks (Google reCAPTCHA), video and live chat (YouTube), and connected itch.io accounts may receive the data needed for those features. Some providers may process data outside Brazil, including in the United States. International transfers must use the legal mechanism and safeguards required by applicable law. External stores handle purchases made through their checkout.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("Retention and deletion")}</h2>
          <p>
            {t("We keep data only as long as needed for the purposes above, security, disputes or legal requirements. Support messages are intended to be kept for up to 90 days; provider logs and backups may have different periods. You can request account deletion in your account settings. The current flow removes account data, including date of birth, sessions and linked registration records, and clears legal-acceptance and newsletter-consent data. A limited email suppression record may remain to honor an unsubscribe; backups, logs and provider records may persist until their retention period expires or the law requires them.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("Cookies and optional content")}</h2>
          <p>
            {t("The site uses a session cookie for sign-in and local storage for preferences. Optional video thumbnails, YouTube players and read-only live chat stay blocked until you allow optional content. Google reCAPTCHA is requested separately on protected forms. Poppins fonts are hosted on this site.")}
          </p>
          <p>
            <a href="/cookies">{t("Cookie Policy")}</a>
          </p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setOptionalContent(!optionalAllowed)}
          >
            {t(optionalAllowed ? "Reject optional content" : "Accept optional content")}
          </button>
        </div>

        <div className="privacy-block">
          <h2>{t("Your rights")}</h2>
          <p>
            {t("Subject to applicable law, you can request confirmation of processing, access, correction, anonymization, blocking or deletion of unnecessary or unlawfully processed data, portability where available, information about sharing and the consequences of refusing consent, and withdrawal of consent. Email")}{" "}
            <a href="mailto:somiarigames@gmail.com">somiarigames@gmail.com</a>
            {t(" to make a request. We may ask for information needed to verify it. You may also contact the ANPD or the data-protection authority responsible for your location.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("Children and age")}</h2>
          <p>
            {t("Account creation requires a date of birth, and the server rejects dates indicating an age under 13. The date is self-reported and is not independently verified. Children and teenagers may access public pages and games. Parents or guardians with a privacy request can contact")}{" "}
            <a href="mailto:somiarigames@gmail.com">somiarigames@gmail.com</a>.
            {" "}{t("This notice does not replace any child-safety measures required by applicable law.")}
          </p>
        </div>

        <p className="privacy-page__date">
          <small>{t("Last updated: October 25, 2026")}</small>
          <small>{t("Document version: privacy-v2026-10-25")}</small>
        </p>
      </section>
    </div>
  );
}
