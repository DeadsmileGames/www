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
          {t("This policy explains what personal data Deadsmile Games processes, why it is used, how it may be shared, and the choices and rights available to you.")}
        </p>
      </Reveal>

      <section className="privacy-page__content">
        <div className="privacy-block">
          <h2>{t("1. Who is responsible for your data?")}</h2>
          <p>
            {t("The controller is Lucas Eduardo Duarte Pereira, an individual operating under the name Deadsmile Games, based in São Paulo, São Paulo, Brazil. No separate data protection officer has been appointed. Based on the operator's confirmation that the operation meets the applicable small-agent size and revenue criteria, is not part of a group exceeding those limits, and does not perform high-risk processing under ANPD Resolution CD/ANPD 2/2022 as amended, the operator intends to rely on the Brazilian small-agent exemption from appointing an encarregado. This is an operator assessment, not a determination by the ANPD, and does not exempt the controller from other LGPD duties or obligations that may apply in other jurisdictions. For privacy requests or questions about personal data, contact somiarigames@gmail.com; this email is the direct channel for privacy requests and communications.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("2. Data we process")}</h2>
          <p>
            {t("Depending on the features you use, we may process your username, email address, password hash, email-verification status, account and session identifiers, security and access records, two-factor authentication settings, and requests to recover or change an account.")}
          </p>
          <p>
            {t("When you register, we record the Terms of Service version you accepted, the Privacy Policy version you acknowledged, the interface language, and the server-recorded time. This record is linked to your account to document the agreement and notice; it is removed with the account under the current deletion flow.")}
          </p>
          <p>
            {t("A public account profile currently displays the games the account holder plans to play. We may process the account username and the selected games needed to provide that profile. The profile should not be understood as a public display of email address or password. If additional profile fields or game-activity features are introduced, this policy will be updated before those changes take effect.")}
          </p>
          <p>
            {t("If you use other features, we may process your email address for the newsletter, the name, age and email details submitted for free-game pre-registration, and the email address, category and message in a support request. Optional YouTube embeds, Google reCAPTCHA, and service infrastructure may also process technical information such as IP address, browser/device information, request metadata, or cookies when those features are loaded or used.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("3. Why we use data and legal bases")}</h2>
          <p>
            {t("We use data to create and maintain accounts; authenticate users; provide profiles, game libraries, achievements, cloud saves and connected-account features; answer support requests; manage free-game pre-registration and newsletter subscriptions; protect the service; prevent abuse; and meet legal obligations or establish, exercise or defend legal claims.")}
          </p>
          <p>
            {t("Depending on the specific activity, the legal basis may be performing a contract or steps requested before a contract, consent for newsletter communications or optional embedded content where applicable, legitimate interests in service security and reliability after balancing users' rights, or compliance with a legal obligation. The applicable basis depends on the feature and circumstances; we do not treat consent as the basis for every necessary account function.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("4. Public profiles and privacy choices")}</h2>
          <p>
            {t("The public profile displays the games you choose to show as games you plan to play. Do not add or select information you do not want other visitors to see. Your email address and password are not displayed on the public profile. If you change or remove a selected game, copies or screenshots already made by other people may remain outside our control.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("5. Service providers and sharing")}</h2>
          <p>
            {t("We do not sell personal data. The production service configuration checked on 23 October 2026 shows the website and API hosted on Render in Oregon, United States, and the active application database hosted on Neon in AWS us-east-2 (Ohio, United States). The API is implemented to use Brevo for transactional email, including account, newsletter and pre-order messages; those emails are sent when the corresponding credentials are configured. Resend can send support-ticket notifications when its API key and notification address are configured. Google reCAPTCHA loads only after you choose to load security verification on a protected form; optional YouTube embeds remain blocked until you allow optional content; and itch.io receives data when you connect that account. A Vercel deployment configuration is present in the code repository, but this review did not verify it as the current production host. Depending on the service, providers may act as processors or independent controllers; their own privacy terms apply when they act as independent controllers.")}
          </p>
          <p>
            {t("The operator reports that the Resend plan is Free and that a Resend data processing agreement (DPA) is confirmed in the account settings. Resend's published documentation states that email and log data are retained for 30 days while an account is active on Free plans; this is provider documentation, not an inspection of the account's individual data. This confirmation does not by itself establish that a Brazilian international-transfer mechanism or every required contractual safeguard is in place. The operator reports Brevo's log-retention setting is the provider default; Brevo's documentation says transactional logs and email previews are stored indefinitely by default unless a retention rule is configured. The actual Brevo setting was not independently inspected. The Render plan is unknown, so Render-specific retention cannot be inferred. The operator identifies no additional providers beyond Render, Neon, Brevo, Resend, Google reCAPTCHA, YouTube and itch.io, although the exact data flows and contractual roles for each still require confirmation. The operator clarified that the relevant feature is free-game pre-registration, not a paid pre-sale or purchase. The existing API and website code still use legacy labels and identifiers such as 'pre-order'; that implementation terminology does not mean users pay for registration. The operator reports that current site access and account features are free. This description must be revisited if paid products, advertising or materially different data collection are introduced.")}
          </p>
          <p>
            {t("Because the verified Render and Neon deployment is in the United States, data needed to operate accounts, the database, support and related features may be transferred to or processed in the United States. Email, security-verification, video and connected-account providers may also process data in other locations according to the features you use. The controller must ensure each transfer subject to the LGPD is covered by a valid mechanism under ANPD Resolution CD/ANPD 19/2024 and provide the information required by that rule. This review verified deployment locations, but did not verify the operator's accepted account-level terms or the Brazilian transfer mechanism for every provider; those details must be confirmed rather than assumed. Data may also be disclosed where required by law or necessary to protect rights and security.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("6. Retention and account deletion")}</h2>
          <p>
            {t("We aim to retain personal data only for as long as needed for the purpose for which it was collected, or for applicable legal, security, accounting or dispute-resolution requirements. We have not verified a complete retention schedule for support tickets, provider logs, database history/backups and all third-party systems, so we do not publish unverified fixed periods. The Neon project currently reports a database history-retention setting of six hours, and the snapshot schedule inspected on 23 October 2026 returned no scheduled snapshots. These settings do not establish the retention periods for provider-managed backups, other operational logs, email-provider copies or third-party systems, which still need confirmation. We will update this policy when the retention schedule and provider settings are documented. Newsletter recipients can unsubscribe using the link provided in subscription messages. When an account is deleted, the newsletter address matching that account is marked as unsubscribed; the limited suppression record described below remains to honor the request and prevent further mail unless a new subscription is explicitly confirmed.")}
          </p>
          <p>
            {t("The operator reports that support tickets are retained for up to 90 days. The operator confirms Resend's Free plan and says its DPA is enabled in account settings; published Resend documentation describes 30-day retention for email and log data on Free plans, but account-specific deletion behavior was not independently inspected. Brevo log retention is reported as the provider default. Brevo documentation describes transactional logs and email previews as retained indefinitely by default unless a retention rule is configured; the account's actual setting and the exact duration were not independently inspected. The Render plan is unknown, so no Render log-retention period is asserted. Neon currently reports six-hour database-history retention, but provider-managed backups and other copies remain unverified. The 90-day support-ticket period does not apply automatically to email notifications, provider logs or backups.")}
          </p>
          <p>
            {t("You can request account deletion in account settings. The current account-deletion flow removes the account, its active sessions and telemetry, pre-order records linked to the account, and legacy pre-order records that have no account link but match the account email. It also marks the newsletter address matching the account email as unsubscribed and clears confirmation and token metadata. The email address and unsubscribe timestamp remain as a minimal suppression record to honor that choice and prevent further mail unless a new subscription is explicitly confirmed. The record of Terms acceptance and Privacy Policy acknowledgment is linked to the account and is deleted when the account is deleted. Copies in backups, operational logs, support tickets and third-party systems may follow different retention periods; those periods and provider settings have not yet been fully verified and must be documented before this policy is treated as final.")}
          </p>
        </div>

        <section className="privacy-block game-meta" aria-labelledby="privacy-consent-title">
          <h2 id="privacy-consent-title">{t("7. Cookies, local storage and optional content")}</h2>
          <p id="privacy-consent-description">
            {t("The site uses a session cookie for sign-in and local storage for settings such as language, optional-content preference and limited interface flows. Optional YouTube embeds are blocked until you allow optional content; you can change that choice here. Google reCAPTCHA is offered separately on protected forms and is loaded only after you choose to load security verification. Google may process technical information under its own terms. Rejecting optional content does not disable the session cookie needed for sign-in, and protected forms may require security verification.")}
          </p>
          <button
            type="button"
            className="btn btn--secondary"
            aria-describedby="privacy-consent-description"
            onClick={() => setOptionalContent(!optionalAllowed)}
          >
            {t(optionalAllowed ? "Revoke optional content consent" : "Allow optional content")}
          </button>
        </section>

        <div className="privacy-block">
          <h2>{t("8. Your rights and how to contact us")}</h2>
          <p>
            {t("Subject to the conditions and exceptions in applicable law, you may request confirmation of processing, access to your data, correction of incomplete or inaccurate data, anonymization, blocking or deletion of unnecessary or unlawfully processed data, portability where applicable, information about sharing, information about the consequences of refusing consent, and revocation of consent. You may also request deletion of data processed on the basis of consent, subject to legal retention exceptions.")}
          </p>
          <p>
            {t("To make a request, email somiarigames@gmail.com from an address that lets us verify and respond to your request. We may ask for proportionate information to verify your identity and protect your account. Requests are handled without charge and within the applicable legal deadlines. You may contact the Brazilian National Data Protection Authority (ANPD) if you believe your rights have not been respected.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("9. Children and teenagers")}</h2>
          <p>
            {t("The account flow asks users to declare that they are at least 13, but this is not independent age verification. Children and teenagers may access the website and games. Game activity, playtime and achievements are private by default unless sharing is enabled. Parents or legal guardians can contact somiarigames@gmail.com about a minor's data. The operator must assess and implement age-appropriate privacy defaults, processes for children's rights, parental safeguards and any other protections required by applicable law; stating a minimum age alone does not satisfy those duties.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("10. Age declarations and safeguards")}</h2>
          <p>{t("The free-game pre-registration form asks for a self-declared age and applies the configured eligibility rule. This is not independent age verification. The minimum age of 13 for pre-registration is a separate eligibility rule chosen by Deadsmile Games; it is not the game's official content rating and does not independently verify age. A self-declaration must not be treated as proof of age where applicable law requires a more reliable mechanism or parental authorization. The operator must assess the safeguards required for children who may access the service; this policy does not claim that the assessment is complete.")}</p>
        </div>

        <div className="privacy-block">
          <h2>{t("11. Regional privacy information")}</h2>
          <p>{t("Brazil: Depending on the service and its audience, the Digital Child and Adolescent Statute may require age assurance, parental supervision or other protections for services directed to or likely accessed by children and teenagers. A self-declared age alone does not establish compliance. You may contact the ANPD if you believe your rights have not been respected.")}</p>
          <p>{t("United States: COPPA can apply to child-directed websites and online services and to general-audience services with actual knowledge that they collect personal information from children under 13. Where it applies, parental notice, verifiable parental consent and processes for parental rights must be supported. Additional state privacy laws may apply depending on the user's residence, the service's activities and statutory thresholds.")}</p>
          <p>{t("Spain and the European Economic Area: Where the GDPR applies, you may exercise its applicable data-protection rights and lodge a complaint with a competent supervisory authority; in Spain, this may include the Spanish Data Protection Agency (AEPD). In Spain, consent-based processing of a child's personal data generally requires parental authorization for children under 14, subject to applicable legal exceptions. Other lawful bases and contract eligibility must be assessed separately.")}</p>
          <p>{t("Deadsmile Games' intended legal-compliance scope for this policy is Brazil, the United States and the European Union. The website may be accessible from other locations, but this policy does not claim that all laws in every other jurisdiction have been assessed or that the service is legally available everywhere. Children and teenagers may access the website and games, although the service is not designed exclusively for children. The account flow currently asks users to declare that they are at least 13; this is not independent age verification. Because children may access the service, the operator must assess and implement age-appropriate privacy defaults, processes for children's and parents' rights, and any additional safeguards required by applicable law. This policy does not claim that those assessments or safeguards are complete.")}</p>
        </div>

        <div className="privacy-block">
          <h2>{t("12. Security and incidents")}</h2>
          <p>
            {t("We use technical and organizational safeguards intended to protect data, including access controls and security measures for accounts and requests. No internet service can guarantee absolute security. If a confirmed incident creates relevant risk or harm, the controller will assess and make the communications required by law to affected people and the competent authority.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("13. Changes to this policy")}</h2>
          <p>
            {t("We may revise this policy when the service or applicable requirements change. The current version and its revision date will be published on this page. Where required, we will provide additional notice or seek a new choice before a materially different use of data.")}
          </p>
        </div>

        <p className="privacy-page__date">
          <small>{t("Last updated: October 23, 2026")}</small>
        </p>
      </section>
    </div>
  );
}
