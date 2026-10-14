import { useLanguage } from "../context/LanguageContext";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SecurityCaptcha as ReCAPTCHA } from "../components/ui/SecurityCaptcha";
import { api, friendlyErrorMessage } from "../services/api";
import { Button } from "../components/ui/Button";
import { ArrowLeft } from "@phosphor-icons/react";

export function ForgotPassword() {
  const { t } = useLanguage();
  const recaptchaRef = useRef(null);

  const [email, setEmail] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  function resetRecaptcha() {
    setRecaptchaToken(null);
    recaptchaRef.current?.reset();
  }

  function handleRecaptchaChange(token) {
    setError(null);
    setRecaptchaToken(token);
  }

  function handleRecaptchaExpired() {
    resetRecaptcha();
  }

  function handleRecaptchaError() {
    resetRecaptcha();

    setError(friendlyErrorMessage({ code: "RECAPTCHA_UNAVAILABLE" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(friendlyErrorMessage({ code: "INTERNAL_ERROR" }));
      return;
    }

    if (!recaptchaToken) {
      setError(friendlyErrorMessage({ code: "RECAPTCHA_REQUIRED" }));
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/auth/forgot-password", {
        email: normalizedEmail,
        recaptchaToken,
      });

      setSent(true);
      resetRecaptcha();
    } catch (err) {
      setError(friendlyErrorMessage(err));

      resetRecaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <Link to="/login" className="back-link">
          <ArrowLeft weight="bold" />
          <span>{t("Back")}</span>
        </Link>

        <h1>{t("Reset password")}</h1>

        {sent ? (
          <>
            <p
              style={{
                color: "#aaa",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              {t("If an account exists for")} <strong>{email}</strong>
              {t(", we just sent a reset link. Check your inbox and spam folder.")}
            </p>

            <Link
              to="/login"
              className="btn btn--primary"
              style={{
                width: "100%",
                justifyContent: "center",
              }}
            >
              {t("Back to sign in")}
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <p className="auth-page__error" role="alert">
                {t(error)}
              </p>
            )}

            <p
              style={{
                color: "#888",
                fontSize: "0.9rem",
                marginBottom: 20,
              }}
            >
              {t(
                "Enter the email linked to your account and we'll send you a link to choose a new password.",
              )}
            </p>

            <div className="auth-page__field">
              <label htmlFor="forgot-email">{t("Email")}</label>

              <input
                id="forgot-email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-page__recaptcha">
              {siteKey ? (
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={siteKey}
                  theme="dark"
                  onChange={handleRecaptchaChange}
                  onExpired={handleRecaptchaExpired}
                  onErrored={handleRecaptchaError}
                />
              ) : (
                <p className="auth-page__error" role="alert">
                  {t("reCAPTCHA is not configured.")}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="auth-page__submit"
              disabled={submitting || !recaptchaToken || !siteKey}
            >
              {submitting ? t("Sending\u2026") : t("Send reset link")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
