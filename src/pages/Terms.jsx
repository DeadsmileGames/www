import { useLanguage } from "../context/LanguageContext";
import { Reveal } from "../components/ui/Reveal";

export function Terms() {
  const { t } = useLanguage();

  return (
    <div className="terms-page container">
      <Reveal>
        <h1>{t("Terms of Service")}</h1>
        <p className="terms-page__intro">
          {t("Terms for using Deadsmile Games accounts and website features.")}
        </p>
      </Reveal>

      <section className="terms-page__content">
        <div className="terms-block">
          <h2>{t("Accounts and eligibility")}</h2>
          <p>
            {t("Provide accurate account information and keep your credentials private. Account creation requires a date of birth indicating age 13 or older. The date is self-reported, not independently verified, and does not replace stronger age checks or parental authorization where required by law.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("Use and public profiles")}</h2>
          <p>
            {t("Do not misuse the service, access accounts without permission, infringe others' rights, or publish another person's personal data without authority. Your profile fields and any game activity, playtime or achievements you choose to share may be public. Sharing controls are off by default where provided.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("Content and intellectual property")}</h2>
          <p>
            {t("Deadsmile Games and its licensors retain their rights to the website, games, artwork, logos, text and code. Do not copy, redistribute or commercially use protected content unless the rights holder or applicable law allows it. Third-party content and services remain subject to their own terms.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("Stores, purchases and refunds")}</h2>
          <p>
            {t("The website does not currently take payment for games. Where a game links to an external store, that store processes the purchase and handles payment and refund requests. Contact that store about a transaction and Deadsmile Games about game support. These terms do not waive mandatory consumer rights.")}
          </p>
          <p>
            <a href="https://itch.io/docs/legal/terms#refunds" target="_blank" rel="noopener noreferrer">
              {t("itch.io refund terms")}
            </a>
            {" · "}
            <a href="https://support.microsoft.com/en-us/accounts-billing/subscriptions/get-a-refund-for-apps-and-games-purchased-from-microsoft-store" target="_blank" rel="noopener noreferrer">
              {t("Microsoft Store refund guidance")}
            </a>
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("Availability and account deletion")}</h2>
          <p>
            {t("Features may change or be temporarily unavailable. You can request account deletion in account settings. Some records may be retained for legal, security, unsubscribe or dispute purposes as described in the Privacy Policy. Nothing in these terms limits rights or remedies that cannot lawfully be limited.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("Operator and contact")}</h2>
          <p>
            {t("Deadsmile Games is operated by Lucas Eduardo Duarte Pereira in São Paulo, Brazil. For questions about these terms, contact")}{" "}
            <a href="mailto:somiarigames@gmail.com">somiarigames@gmail.com</a>.
          </p>
        </div>

        <p className="terms-page__date">
          <small>{t("Last updated: October 25, 2026")}</small>
          <small>{t("Document version: terms-v2026-10-25")}</small>
        </p>
      </section>
    </div>
  );
}
