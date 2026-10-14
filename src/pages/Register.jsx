import { friendlyErrorMessage } from "../services/api";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SecurityCaptcha as ReCAPTCHA } from "../components/ui/SecurityCaptcha";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { useLanguage } from "../context/LanguageContext";
import { ArrowLeft } from "@phosphor-icons/react";

export function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const recaptchaRef = useRef(null);
  const submitLock = useRef(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  function update(field) {
    return (e) => {
      setForm((current) => ({
        ...current,
        [field]: e.target.value,
      }));
    };
  }

  function handleRecaptchaChange(token) {
    setRecaptchaToken(token);
    setError(null);
  }

  function handleRecaptchaExpired() {
    setRecaptchaToken(null);
  }

  function handleRecaptchaError() {
    setRecaptchaToken(null);
    setError(friendlyErrorMessage({ code: "RECAPTCHA_UNAVAILABLE" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLock.current) return;
    setError(null);

    if (!recaptchaSiteKey) {
      setError(friendlyErrorMessage({ code: "RECAPTCHA_NOT_CONFIGURED" }));
      return;
    }

    if (!recaptchaToken) {
      setError(friendlyErrorMessage({ code: "RECAPTCHA_REQUIRED" }));
      return;
    }

    if (!/^[A-Za-z0-9_]{3,24}$/.test(form.username.trim())) {
      setError(friendlyErrorMessage({ code: "USERNAME_INVALID" }));
      return;
    }

    if (
      form.password.length < 8 ||
      form.password.length > 128 ||
      !/[A-Za-z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      setError(friendlyErrorMessage({ code: "PASSWORD_INVALID" }));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(friendlyErrorMessage({ code: "PASSWORD_MISMATCH" }));
      return;
    }

    submitLock.current = true;
    setSubmitting(true);

    try {
      const result = await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        recaptchaToken,
      });

      navigate(result?.verificationRequired ? "/verify-email" : "/account", {
        replace: true,
        state: {
          registered: true,
        },
      });
    } catch (err) {
      setError(friendlyErrorMessage(err));
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      submitLock.current = false;
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

        <h1>{t("auth.register")}</h1>

        {error && (
          <p className="auth-page__error" role="alert">
            {t(error)}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-page__field">
            <label htmlFor="username">{t("auth.username")}</label>

            <input
              id="username"
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]{3,24}"
              value={form.username}
              onChange={update("username")}
              autoComplete="username"
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="reg-email">{t("auth.email")}</label>

            <input
              id="reg-email"
              type="email"
              required
              maxLength={254}
              value={form.email}
              onChange={update("email")}
              autoComplete="email"
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="reg-password">{t("auth.password")}</label>

            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-page__field">
            <label htmlFor="confirmPassword">{t("auth.confirm")}</label>

            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-page__recaptcha">
            {recaptchaSiteKey ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={handleRecaptchaChange}
                theme="dark"
                onExpired={handleRecaptchaExpired}
                onErrored={handleRecaptchaError}
              />
            ) : (
              <p className="auth-page__error" role="alert">
                {t("Security verification is unavailable.")}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="auth-page__submit"
            disabled={submitting || !recaptchaToken}
          >
            {submitting ? t("auth.creating") : t("auth.create")}
          </Button>
        </form>

        <p className="auth-page__footer">
          {t("auth.existing")} <Link to="/login">{t("auth.login")}</Link>
        </p>
      </div>
    </div>
  );
}
