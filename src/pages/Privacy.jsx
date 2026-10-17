import {
  useLanguage } from "../context/LanguageContext";
import { useOptionalContent,
  setOptionalContent } from "../utils/consent";
import { Reveal } from "../components/ui/Reveal";

export function Privacy() {
  const { t } = useLanguage();
  const optionalAllowed = useOptionalContent();

  return (
    <div className="privacy-page container">
      

      <Reveal>
        <h1>{t("Privacy Policy")}</h1>
        <p className="privacy-page__intro">
          {t(
            "Deadsmile Games respects your privacy. This policy explains how we collect, use, and protect your personal data.",
          )}
        </p>
      </Reveal>

      <section className="privacy-page__content">
        <div className="privacy-block">
          <h2>{t("1. Information we collect")}</h2>
          <p>
            {t(
              "We collect information you provide directly, such as when you create an account, subscribe to our newsletter, or contact support. This may include your name, email address, username, and any other details you choose to share.",
            )}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("2. How we use your data")}</h2>
          <p>
            {t(
              "We use your data to operate, maintain, and improve our services, to communicate with you, and to personalize your experience. We do not sell your personal information to third parties.",
            )}
          </p>
        </div>

        <section
          className="privacy-block game-meta"
          aria-labelledby="privacy-consent-title"
        >
          <h2 id="privacy-consent-title">{t("3. Cookies and tracking")}</h2>

          <p id="privacy-consent-description">
            {t(
              "We use essential session and security cookies when required to operate signed-in features. Optional YouTube content loads only after your consent, which you can revoke here. Google reCAPTCHA loads only after you authorize security verification on a protected form. Preferences are stored locally. We do not currently use an analytics-cookie integration in this website codebase.",
            )}
          </p>

          <button
            type="button"
            className="btn btn--secondary"
            aria-describedby="privacy-consent-description"
            onClick={() => setOptionalContent(!optionalAllowed)}
          >
            {t(
              optionalAllowed
                ? "Revoke optional content consent"
                : "Allow optional content",
            )}
          </button>
        </section>

        <div className="privacy-block">
          <h2>{t("4. Data security")}</h2>
          <p>
            {t(
              "We implement reasonable security measures to protect your data. However, no method of transmission over the internet is 100% secure.",
            )}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("5. Your rights")}</h2>
          <p>
            {t(
              "You may access, update, or delete your account information at any time through your account settings. For any questions, contact us at ",
            )}
            <a href="mailto:deadsmilegames@gmail.com">deadsmilegames@gmail.com</a>.
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("6. Changes to this policy")}</h2>
          <p>
            {t(
              "We may update this policy from time to time. We will notify you of significant changes by posting a notice on our site.",
            )}
          </p>
        </div>

        <p className="privacy-page__date">
          <small>{t("Last updated: October 2026")}</small>
        </p>
      </section>
    </div>
  );
}
