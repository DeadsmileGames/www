import { useLanguage } from "../context/LanguageContext";
import { Reveal } from "../components/ui/Reveal";

export function Accessibility() {
  const { t } = useLanguage();

  return (
    <div className="privacy-page container">
      <Reveal>
        <h1>{t("Accessibility")}</h1>
        <p className="privacy-page__intro">
          {t("Deadsmile Games is working to make the website accessible to as many people as possible.")}
        </p>
      </Reveal>
      <section className="privacy-page__content">
        <div className="privacy-block">
          <h2>{t("1. Accessibility target")}</h2>
          <p>{t("WCAG 2.2 Level AA is the technical target for accessibility reviews and improvements. This is an ongoing target, not a statement that every page currently conforms and not an independent certification.")}</p>
        </div>
        <div className="privacy-block">
          <h2>{t("2. Areas under review")}</h2>
          <p>{t("We review keyboard access, visible focus, headings and form labels, error and status announcements, contrast, zoom and reflow, alternative text, reduced motion, dialogs and third-party media. Some content and controls are provided by external services and may have limitations outside our direct control.")}</p>
        </div>
        <div className="privacy-block">
          <h2>{t("3. Report an accessibility barrier")}</h2>
          <p>{t("If something on the website prevents you from completing a task, contact")} <a href="mailto:somiarigames@gmail.com">somiarigames@gmail.com</a>. {t("Please include the page URL, what you were trying to do, your browser and device, and any assistive technology involved if you are comfortable sharing that information. Do not send passwords or sensitive personal information. Reports help us prioritize fixes; this statement does not promise a specific response deadline.")}</p>
        </div>
        <p className="terms-page__date">
          <small>{t("Last updated: October 24, 2026")}</small>
        </p>
      </section>
    </div>
  );
}
