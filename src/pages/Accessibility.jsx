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
