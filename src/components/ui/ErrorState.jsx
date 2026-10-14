import { useLanguage } from "../../context/LanguageContext";
import { friendlyErrorMessage } from "../../services/api";
import { Button } from "./Button";

export function ErrorState({
  title = "UNABLE TO LOAD CONTENT",
  message = friendlyErrorMessage({ code: "INTERNAL_ERROR" }),
  onRetry,
}) {
  const { t } = useLanguage();
  return (
    <div className="state-block" role="alert">
      <h3 className="state-block__title">{t(title)}</h3>
      <p className="state-block__message">{t(message)}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          {t("Try again")}
        </Button>
      )}
    </div>
  );
}
