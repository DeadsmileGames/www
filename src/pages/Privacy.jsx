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
            {t("The controller is Lucas Eduardo Duarte Pereira, an individual operating under the name Deadsmile Games, based in São Paulo, São Paulo, Brazil. For privacy requests or questions about personal data, contact somiarigames@gmail.com. No separate data protection officer has been appointed at this time. The operator is assessing whether the Brazilian small-agent exemption applies; this does not imply an exemption from any duties that may apply under other jurisdictions. This email is the direct channel for privacy requests and communications.")}
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
            {t("If you choose to use profile, gaming, or connected-account features, we may process your biography, website, location, avatar and banner URLs, linked itch.io account and related entitlement information, game activity, playtime, sessions, achievements, cloud saves, and telemetry for supported games. Public profile fields and sharing of game activity, playtime, and achievements are subject to the settings and choices described below.")}
          </p>
          <p>
            {t("If you use other features, we may process your email address for the newsletter, the name, age and email details submitted for a pre-order, and the email address, category and message in a support request. Optional YouTube embeds, Google reCAPTCHA, and service infrastructure may also process technical information such as IP address, browser/device information, request metadata, or cookies when those features are loaded or used.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("3. Why we use data and legal bases")}</h2>
          <p>
            {t("We use data to create and maintain accounts; authenticate users; provide profiles, game libraries, achievements, cloud saves and connected-account features; answer support requests; manage pre-orders and newsletter subscriptions; protect the service; prevent abuse; and meet legal obligations or establish, exercise or defend legal claims.")}
          </p>
          <p>
            {t("Depending on the specific activity, the legal basis may be performing a contract or steps requested before a contract, consent for newsletter communications or optional embedded content where applicable, legitimate interests in service security and reliability after balancing users' rights, or compliance with a legal obligation. The applicable basis depends on the feature and circumstances; we do not treat consent as the basis for every necessary account function.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("4. Public profiles and privacy choices")}</h2>
          <p>
            {t("A public profile can display your username, avatar, biography, website, location and account creation date. Only add information you are comfortable making public. In account privacy settings, game activity, playtime and achievements are private by default and can be shared separately. You can change these choices in your account settings; changes may not remove copies already viewed, saved or cached by other people or services.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("5. Service providers and sharing")}</h2>
          <p>
            {t("We do not sell personal data. We may share the minimum data needed with service providers that host the website and API (Vercel and Render), provide the database (Neon), deliver email (Brevo and Resend), protect forms against abuse (Google reCAPTCHA), or provide content you choose to load (YouTube) and connected-account features (itch.io). The exact providers and processing activities in production must be checked against the live configuration. Providers may act as processors or independent controllers depending on the service and processing activity; their own privacy terms also apply where they act as independent controllers.")}
          </p>
          <p>
            {t("Some providers may process data outside Brazil. Where an international transfer occurs, the controller must use a transfer mechanism permitted by the LGPD and applicable ANPD rules. Data may also be disclosed where required by law or necessary to protect rights and security. The operator should confirm the providers, countries, contracts and transfer mechanisms actually used by production.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("6. Retention and account deletion")}</h2>
          <p>
            {t("We aim to retain personal data only for as long as needed for the purpose for which it was collected, or for applicable legal, security, accounting or dispute-resolution requirements. Fixed retention periods have not yet been established for every data category and provider; we are reviewing them and will update this policy when the schedule is confirmed. Newsletter recipients can unsubscribe using the link provided in subscription messages, and account deletion is intended to cancel the newsletter subscription associated with the same email address.")}
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
            {t("The Terms set a minimum age of 13 to create an account. Because games and online services may be accessed by children and teenagers, we aim to use privacy-protective defaults, including keeping game activity, playtime and achievements private unless sharing is enabled. Parents or legal guardians who have a concern about a minor's data may contact us at somiarigames@gmail.com. The operator must separately assess and implement any age-assurance, parental-supervision, content-rating and other safeguards required by the LGPD, the Digital Child and Adolescent Statute and applicable rules; a minimum-age statement alone does not satisfy those duties.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("10. Age declarations and safeguards")}</h2>
          <p>{t("The pre-order form asks you to enter your age as a number. This is a self-declaration, not an independent age-verification method. Account registration asks users to confirm that they are at least 13. Deadsmile Games does not currently use CPF checks, selfie-based estimation or a paid third-party age-verification service for these flows. A declaration must not be treated as proof of age where applicable law requires a more reliable mechanism, parental authorization or an age-based restriction. The operator must assess which features and users require additional safeguards and restrict the relevant feature until those safeguards are implemented.")}</p>
        </div>

        <div className="privacy-block">
          <h2>{t("11. Regional privacy information")}</h2>
          <p>{t("Brazil: Depending on the service and its audience, the Digital Child and Adolescent Statute may require age assurance, parental supervision or other protections for services directed to or likely accessed by children and teenagers. A self-declared age alone does not establish compliance. You may contact the ANPD if you believe your rights have not been respected.")}</p>
          <p>{t("United States: COPPA can apply to child-directed websites and online services and to general-audience services with actual knowledge that they collect personal information from children under 13. Where it applies, parental notice, verifiable parental consent and processes for parental rights must be supported. Additional state privacy laws may apply depending on the user's residence, the service's activities and statutory thresholds.")}</p>
          <p>{t("Spain and the European Economic Area: Where the GDPR applies, you may exercise its applicable data-protection rights and lodge a complaint with a competent supervisory authority; in Spain, this may include the Spanish Data Protection Agency (AEPD). In Spain, consent-based processing of a child's personal data generally requires parental authorization for children under 14, subject to applicable legal exceptions. Other lawful bases and contract eligibility must be assessed separately.")}</p>
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
          <small>{t("Last updated: October 2026")}</small>
        </p>
      </section>
    </div>
  );
}
