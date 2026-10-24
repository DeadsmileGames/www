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
            {t("The controller is Lucas Eduardo Duarte Pereira, an individual operating under the name Deadsmile Games in São Paulo, Brazil. For privacy questions and requests to access, correct or delete personal data, contact somiarigames@gmail.com. This is the official contact for privacy requests. This policy does not promise a specific response time.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("2. Data we process")}</h2>
          <p>
            {t("Depending on the features you use, we may process your username, email address, date of birth supplied during account registration, password hash, email-verification status, account and session identifiers, security and access records, two-factor authentication settings, and requests to recover or change an account. The date of birth is used to apply the account's minimum-age eligibility rule, is not displayed on public profiles, and is not independently verified.")}
          </p>
          <p>
            {t("When you register, we record the Terms of Service version you accepted, the Privacy Policy version you acknowledged, the interface language, and the server-recorded time. This record is linked to your account to document the agreement and notice; it is removed with the account under the current deletion flow.")}
          </p>
          <p>
            {t("Public profiles can display your username, avatar, bio, website and location where provided, plus recent game activity, playtime or session details and achievements according to the privacy settings you choose. Your email address and password are not displayed publicly. Profile banners are available only to designated official profiles.")}
          </p>
          <p>
            {t("If you use other features, we may process your email address for the newsletter; first name, last name, self-declared age and email submitted for free-game pre-registration; and the email address, category and message in a support request. Supported cloud-save features also process save data needed to store, retrieve and protect your game saves. Optional YouTube embeds, Google reCAPTCHA and service infrastructure may process technical information such as IP address, browser/device information, request metadata or cookies when those features are loaded or used.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("3. Why we use data and legal bases")}</h2>
          <p>
            {t("We use data to create and maintain accounts; authenticate users; display public profiles and user-controlled game activity, playtime and achievements; provide game discovery and library features; store and retrieve cloud saves for supported games; manage free-game pre-registration and newsletter subscriptions; answer support requests; protect the service and prevent abuse; and meet legal obligations or establish, exercise or defend legal claims.")}
          </p>
          <p>
            {t("Depending on the specific activity, the legal basis may be performing a contract or steps requested before a contract, consent for newsletter communications or optional embedded content where applicable, legitimate interests in service security and reliability after balancing users' rights, or compliance with a legal obligation. The applicable basis depends on the feature and circumstances; we do not treat consent as the basis for every necessary account function.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("4. Public profiles and privacy choices")}</h2>
          <p>
            {t("The public profile may display recent games and, depending on your settings, playtime or session details and achievements. These sharing controls are off by default. Your username and profile fields you provide, such as avatar, bio, website or location, may also be visible. Your email address and password are not displayed publicly. Changing a privacy setting affects what the site serves going forward, but copies or screenshots already made by other people may remain outside our control.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("5. Service providers and sharing")}</h2>
          <p>
            {t("We do not sell personal data. We use service providers to host the website and API (Render), operate the application database (Neon), send transactional email and newsletter messages (Brevo), send support notifications when configured (Resend), protect selected forms (Google reCAPTCHA), display optional video embeds and externally hosted video thumbnails (YouTube and the relevant media host), and verify ownership when you connect an itch.io account. Poppins font files are self-hosted on this website; loading the font does not require a request to Google Fonts. These providers may receive technical information or data needed for the feature you use. Their own privacy notices describe processing they carry out for their own purposes.")}
          </p>
          <p>
            {t("The website currently provides free accounts, free-game features and free-game pre-registration; the pre-registration flow does not collect payment. Some games may link to external stores, which handle purchases and their own refund process. Provider-specific retention settings, deletion behavior and contractual safeguards are not all verified. We will keep this notice under review as those settings are confirmed and before materially different data collection or paid website checkout is introduced.")}
          </p>
          <p>
            {t("Some providers process or host information outside your country, including in the United States. Depending on the feature, data may also be handled by email, security-verification, video and connected-account providers in other locations. International transfers must be covered by the safeguards required by the laws that apply to the relevant processing. Provider-specific transfer terms and the applicable Brazilian safeguards still require final verification; this notice does not claim that every transfer arrangement has been independently verified. Data may also be disclosed where required by law or necessary to protect rights and security.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("6. Retention and account deletion")}</h2>
          <p>
            {t("We retain personal data only as long as needed for the purpose for which it was collected, or for applicable legal, security or dispute-resolution requirements. Support requests are intended to be retained for up to 90 days. This period does not automatically apply to provider logs, email copies, database history, backups or other third-party records; those retention periods and settings still require confirmation. Newsletter recipients can unsubscribe using the link provided in subscription messages. When an account is deleted, the newsletter address matching that account is marked as unsubscribed; a limited suppression record may remain to honor that choice and prevent further mail unless a new subscription is explicitly confirmed.")}
          </p>
          <p>
            {t("You can request account deletion in account settings. The current deletion flow removes the account record, including its stored date of birth, sessions and telemetry, and pre-registration records linked to the account or legacy records matching its email where no other account is linked. It also unsubscribes the matching newsletter address and clears confirmation tokens and newsletter consent metadata, while retaining a limited email suppression record to prevent further mail. The record of Terms acceptance and Privacy Policy acknowledgment is deleted with the account. Copies in backups, operational logs, support messages and third-party systems may follow separate retention periods that are still being verified.")}
          </p>
        </div>

        <section className="privacy-block game-meta" aria-labelledby="privacy-consent-title">
          <h2 id="privacy-consent-title">{t("7. Cookies, local storage and optional content")}</h2>
          <p id="privacy-consent-description">
            {t("The site uses a session cookie for sign-in and local storage for language preference, optional-content preference and limited interface state. The optional-content setting blocks externally hosted video thumbnails and YouTube embedded players until you allow optional content; locally hosted artwork can still load. The Poppins font is self-hosted and does not require a font request to Google Fonts. Google reCAPTCHA is offered separately on protected forms and is loaded only after you choose to load security verification. Other features may make their own provider requests as described in this policy. Rejecting optional content does not disable the session cookie needed for sign-in.")}
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
            {t("The account form requires a date of birth, and the server applies the 13-year minimum to that self-reported date before creating an account. A supplied date of birth is not independently verified and does not establish that the person is the age they claim. Children and teenagers may still access the public website and games. Recent game activity, playtime or session details and achievements can be shown on public profiles only according to the available privacy settings. Parents or legal guardians can contact somiarigames@gmail.com about a minor's data. The service's safeguards for children must be assessed against applicable laws and actual data flows; collecting a date of birth alone does not settle those requirements.")}
          </p>
        </div>

        <div className="privacy-block">
          <h2>{t("10. Age declarations and safeguards")}</h2>
          <p>{t("The free-game pre-registration form asks for a first name, last name, email address and self-declared age. The age is compared with the eligibility requirement configured for that game; it is not independent age verification. A self-declaration must not be treated as proof of age where applicable law requires a more reliable mechanism or parental authorization. Account registration separately requires a date of birth and applies a 13-year minimum on the server, but the date is self-reported and is not independently verified. These checks do not by themselves establish that all child-safety requirements have been met.")}</p>
        </div>

        <div className="privacy-block">
          <h2>{t("11. Regional privacy information")}</h2>
          <p>{t("Brazil: Depending on the service and its audience, the Digital Child and Adolescent Statute may require age assurance, parental supervision or other protections for services directed to or likely accessed by children and teenagers. A self-declared age alone does not establish compliance. You may contact the ANPD if you believe your rights have not been respected.")}</p>
          <p>{t("United States: COPPA can apply to child-directed websites and online services and to general-audience services with actual knowledge that they collect personal information from children under 13. Where it applies, parental notice, verifiable parental consent and processes for parental rights must be supported. Additional state privacy laws may apply depending on the user's residence, the service's activities and statutory thresholds.")}</p>
          <p>{t("Spain and the European Economic Area: Where the GDPR applies, you may exercise its applicable data-protection rights and lodge a complaint with a competent supervisory authority; in Spain, this may include the Spanish Data Protection Agency (AEPD). In Spain, consent-based processing of a child's personal data generally requires parental authorization for children under 14, subject to applicable legal exceptions. Other lawful bases and contract eligibility must be assessed separately.")}</p>
          <p>{t("Deadsmile Games' intended legal-compliance scope for this policy is Brazil, the United States and the European Union. The website may be accessible from other locations, but this policy does not claim that all laws in every other jurisdiction have been assessed or that the service is legally available everywhere. The operator reports that the current games are suitable for children and that children may access the website and games. This fact alone does not determine whether the website is child-directed under COPPA or settle which safeguards apply in Brazil, the United States or the European Union. The account flow asks users to declare that they are at least 13; this is not independent age verification. The operator must assess the actual audience, data flows and applicable child-privacy requirements and implement any required safeguards. This policy does not claim that this assessment or those safeguards are complete.")}</p>
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
          <small>{t("Last updated: October 24, 2026")}</small>
          <small>{t("Document version: privacy-v2026-10-24")}</small>
        </p>
      </section>
    </div>
  );
}
