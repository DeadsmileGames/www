import { useLanguage } from "../context/LanguageContext";
import { Reveal } from "../components/ui/Reveal";

export function Accessibility() {
  const { t } = useLanguage();

  return (
    <div className="privacy-page container">
      <Reveal>
        <h1>{t("Accessibility")}</h1>
        <p className="privacy-page__intro">
          {t("Deadsmile Games is working to make this website accessible to people with disabilities.")}
        </p>
      </Reveal>
      <section className="privacy-page__content">
        <div className="privacy-block">
          <h2>{t("Accessibility target")}</h2>
          <p>
            {t("We use WCAG 2.2 Level AA as the target for accessibility improvements. This is a goal, not a claim that every page conforms or has been independently certified.")}
          </p>
        </div>
        <div className="privacy-block">
          <h2>{t("Report a barrier")}</h2>
          <p>
            {t("If a page or feature prevents you from accessing information or completing a task, contact")}{" "}
            <a href="mailto:somiarigames@gmail.com">somiarigames@gmail.com</a>.
            {" "}{t("Please include the page address and describe the barrier. Do not send passwords or sensitive personal information.")}
          </p>
        </div>
        <p className="terms-page__date">
          <small>{t("Last updated: October 25, 2026")}</small>
        </p>
      </section>
    </div>
  );
}
