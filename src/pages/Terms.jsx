import { useLanguage } from "../context/LanguageContext";
import { Reveal } from "../components/ui/Reveal";

export function Terms() {
  const { t } = useLanguage();
  return (
    <div className="terms-page container">
      <Reveal>
        <h1>{t("Terms of Service")}</h1>
        <p className="terms-page__intro">
          {t("These terms govern your use of the Deadsmile Games website and related account features. Please read them together with the Privacy Policy.")}
        </p>
      </Reveal>

      <section className="terms-page__content">
        <div className="terms-block">
          <h2>{t("1. Acceptance and scope")}</h2>
          <p>
            {t("By accessing or using the website, you agree to these terms. If you do not agree, do not create an account or use account-only features. Mandatory rights under consumer-protection, privacy and other applicable laws are not waived by these terms.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("2. Eligibility and accounts")}</h2>
          <p>
            {t("You must be at least 13 years old to create an account. You must provide accurate information, keep your credentials confidential and notify us if you suspect unauthorized use. Do not create an account for someone else without authority. The operator may apply additional age, parental-supervision or content-access safeguards required by applicable law.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("3. Public profiles and user content")}</h2>
          <p>
            {t("You are responsible for content you add to your profile. Do not publish personal information about another person without a lawful reason or permission. Your username, avatar, biography, website and location may be visible on your public profile. Game activity, playtime and achievements remain private by default and are shared only according to your account privacy settings. You can change those settings, but cannot guarantee removal of copies already made by others.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("4. Acceptable use")}</h2>
          <p>
            {t("Do not use the service unlawfully, harass or threaten others, impersonate another person, submit malicious content, attempt unauthorized access, interfere with service operation, or violate the rights of others. We may investigate credible reports and restrict access where reasonably necessary for safety, security, legal compliance or enforcement of these terms. Where appropriate, we will provide notice and a way to contact support.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("5. Intellectual property")}</h2>
          <p>
            {t("Website content, games, artwork, text, logos and code belong to Deadsmile Games or their respective licensors and are protected by applicable law. You may not copy, redistribute or commercially use protected material except where the rights holder or applicable law permits it. Third-party games, stores, videos and services remain subject to their own terms.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("6. Privacy and third-party services")}</h2>
          <p>
            {t("The Privacy Policy explains how personal data is processed and how to exercise your rights. Optional embedded content and security verification may involve third-party providers. If you connect an external account or follow a store link, that provider's terms and privacy policy also apply to its service. Purchases and ownership on third-party stores are handled by the relevant store, not by these terms.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("7. Availability and service changes")}</h2>
          <p>
            {t("We work to keep the website available and secure, but features may change, be suspended for maintenance, or become unavailable. We do not promise uninterrupted or error-free operation. This clause does not exclude any warranty, remedy or responsibility that cannot lawfully be excluded.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("8. Liability and legal rights")}</h2>
          <p>
            {t("To the extent permitted by applicable law, we are not responsible for indirect losses caused by events outside our reasonable control. Nothing in these terms excludes or limits liability where such exclusion is prohibited, or reduces mandatory consumer rights, data-protection rights, or remedies for intentional misconduct or other liability that cannot be limited by law.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("9. Account suspension and deletion")}</h2>
          <p>
            {t("You can request account deletion through account settings. We may temporarily restrict an account when reasonably necessary to protect users, investigate abuse, secure the service or comply with law. Where legally and practically appropriate, we will explain the reason and provide a support contact. Data handling after deletion is described in the Privacy Policy and remains subject to lawful retention requirements.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("10. Changes and contact")}</h2>
          <p>
            {t("We may update these terms as the service or law changes. The current version and revision date will appear here. Material changes will be communicated where required; continued use does not remove any right you have under mandatory law. For questions about these terms, contact deadsmilegames@gmail.com.")}
          </p>
        </div>

        <p className="terms-page__date">
          <small>{t("Last updated: October 2026")}</small>
        </p>
      </section>
    </div>
  );
}
