import { useLanguage } from "../../context/LanguageContext";
import { forwardRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export const SecurityCaptcha = forwardRef(function SecurityCaptcha(props, ref) {
  const { t, language } = useLanguage();
  const [allowed, setAllowed] = useState(false);
  if (!allowed)
    return (
      <div>
        <p>
          {t(
            "Google reCAPTCHA receives connection and browser information to protect this form. Allow it to continue.",
          )}
        </p>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setAllowed(true)}
        >
          {t("Load security verification")}
        </button>
      </div>
    );
  return <ReCAPTCHA {...props} hl={language} key={language} ref={ref} />;
});
