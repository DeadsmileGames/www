import { useLanguage } from "../../context/LanguageContext";

export function EmptyState({ title = "NO GAMES AVAILABLE", titleVariables, message, messageVariables, action }) {
  const { t } = useLanguage();
  return (
    <div className="state-block" role="status">
      <h3 className="state-block__title">{t(title, titleVariables)}</h3>
      {message && <p className="state-block__message">{t(message, messageVariables)}</p>}
      {action}
    </div>
  );
}
