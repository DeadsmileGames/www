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
            {t("By creating an account or using features that require an account, you agree to these terms. If you do not agree, do not create an account or use account-only features. Mandatory rights under consumer-protection, privacy and other applicable laws are not waived by these terms.")}
          </p>
          <p>
            {t("These terms and the Privacy Policy are written with a compliance scope focused on Brazil, the United States and the European Union. The website may be accessible elsewhere, but we do not represent that all laws in every other jurisdiction have been assessed or that the service is legally available everywhere. Mandatory rights that apply to you are not limited by this statement.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("2. Eligibility and accounts")}</h2>
          <p>
            {t("The account form requires a date of birth and the server applies a minimum age of 13 before creating an account. The date of birth is self-reported and is not independently verified; it should not be treated as proof of age where a stronger mechanism or parental authorization is required by law. Children and teenagers may access the website and games, and the operator must assess safeguards required for that audience under applicable law. You must provide accurate information, keep your credentials confidential and notify us if you suspect unauthorized use. Do not create an account for someone else without authority. The operator may apply additional age, parental-supervision or content-access safeguards required by applicable law.")}
          </p>
        </div>

        <div className="terms-block">
          <h2>{t("3. Public profiles and user content")}</h2>
          <p>
            {t("Your public profile can show recent game activity and, according to your privacy settings, playtime or session details and achievements. Sharing controls are off by default. Profile fields you provide, such as avatar, bio, website or location, may be visible. Your email address and password are not displayed publicly. Do not use your profile to publish personal information about another person. If you change a privacy setting, copies or screenshots already made by others may remain outside our control.")}
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
            {t("The Privacy Policy explains how personal data is processed and how to exercise your rights. Optional embedded content and security verification may involve third-party providers. If you connect an external account or follow a store link, that provider's terms and privacy policy also apply to its service. The website does not currently sell paid games or collect checkout payments. If a game links to an external store, that store handles the checkout and payment, identifies the seller for that transaction, and applies its own refund process. For payment, delivery or refund complaints, contact the store that processed the purchase; contact Deadsmile Games for game-related support. Nothing in these terms waives mandatory consumer rights.")}
          </p>
          <p>
            {t("Official external-store policies:")}{" "}
            <a href="https://itch.io/docs/legal/terms#refunds" target="_blank" rel="noopener noreferrer">
              {t("itch.io Terms of Service — refunds")}
            </a>
            {" · "}
            <a href="https://support.microsoft.com/en-us/accounts-billing/subscriptions/get-a-refund-for-apps-and-games-purchased-from-microsoft-store" target="_blank" rel="noopener noreferrer">
              {t("Microsoft Store refund guidance")}
            </a>
            . {t("Check the policy for the store that processed your purchase. Mandatory consumer rights remain unaffected.")}
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
            {t("The website and related account services are operated by Lucas Eduardo Duarte Pereira, an individual operating under the name Deadsmile Games, based in São Paulo, São Paulo, Brazil. For questions about these terms or privacy matters, contact somiarigames@gmail.com. We may update these terms as the service or law changes. The current version and revision date will appear here. Material changes will be communicated where required; continued use does not remove any right you have under mandatory law.")}
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
