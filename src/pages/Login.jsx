import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SecurityCaptcha as ReCAPTCHA } from "../components/ui/SecurityCaptcha";
import { useAuth } from "../hooks/useAuth";
import { api, friendlyErrorMessage } from "../services/api";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";

export function Login() {
  const { login, verifyTwoFactor } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [emailResent, setEmailResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);

  const recaptchaRef = useRef(null);
  const submitLock = useRef(false);
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  const step = needsEmailVerification
    ? "email"
    : twoFactorRequired
      ? "twoFactor"
      : "login";

  const fromLocation = location.state?.from;
  const returnToParam = new URLSearchParams(location.search).get("returnTo");
  const candidate =
    typeof fromLocation === "string"
      ? fromLocation
      : fromLocation?.pathname
        ? `${fromLocation.pathname}${fromLocation.search || ""}${fromLocation.hash || ""}`
        : returnToParam || "/account";

  const from =
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.includes("\\") &&
    !/[\u0000-\u001f]/.test(candidate)
      ? candidate
      : "/account";

  function finishLogin() {
    try {
      window.localStorage.removeItem("deadsmile:auth:returnTo");
    } catch {
      
    }
    navigate(from, { replace: true });
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

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitLock.current) return;

    setError(null);
    setNeedsEmailVerification(false);
    setEmailResent(false);

    if (!recaptchaSiteKey) {
      setError(friendlyErrorMessage({ code: "RECAPTCHA_NOT_CONFIGURED" }));
      return;
    }

    if (!recaptchaToken) {
      setError(friendlyErrorMessage({ code: "RECAPTCHA_REQUIRED" }));
      return;
    }

    submitLock.current = true;
    setSubmitting(true);

    try {
      const response = await login(form.email, form.password, recaptchaToken);

      if (response?.requiresTwoFactor) {
        setTwoFactorRequired(true);
        setTwoFactorCode("");
        return;
      }

      finishLogin();
    } catch (err) {
      setNeedsEmailVerification(err?.code === "EMAIL_NOT_VERIFIED");
      setError(friendlyErrorMessage(err));
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  async function resendConfirmation() {
    if (submitLock.current || !needsEmailVerification) return;

    submitLock.current = true;
    setResending(true);
    setEmailResent(false);
    setError(null);

    try {
      await api.post("/auth/resend-email", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setEmailResent(true);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      submitLock.current = false;
      setResending(false);
    }
  }

  async function handleTwoFactorSubmit(event) {
    event.preventDefault();
    if (submitLock.current) return;

    setError(null);

    const token = twoFactorCode.replace(/\D/g, "").slice(0, 6);

    if (token.length !== 6) {
      setError(friendlyErrorMessage({ code: "VALIDATION_ERROR" }));
      return;
    }

    submitLock.current = true;
    setTwoFactorSubmitting(true);

    try {
      await verifyTwoFactor(token);
      finishLogin();
    } catch (err) {
      if (err?.code === "TWO_FACTOR_CHALLENGE_EXPIRED") {
        setTwoFactorRequired(false);
        setTwoFactorCode("");
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
      }
      setError(friendlyErrorMessage(err));
    } finally {
      submitLock.current = false;
      setTwoFactorSubmitting(false);
    }
  }

  function backToSignIn() {
    if (submitLock.current) return;

    setNeedsEmailVerification(false);
    setEmailResent(false);
    setTwoFactorRequired(false);
    setTwoFactorCode("");
    setRecaptchaToken(null);
    recaptchaRef.current?.reset();
    setError(null);
  }

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <Link to="/" className="back-link">
          <ArrowLeft weight="bold" />
          <span>{t("Back")}</span>
        </Link>

        <h1>
          {step === "email"
            ? t("Email verification")
            : step === "twoFactor"
              ? t("Two-Factor Authentication")
              : t("auth.login")}
        </h1>

        {error && (
          <p className="auth-page__error" role="alert" aria-live="polite">
            {t(error)}
          </p>
        )}

        {step === "email" && (
          <section className="account-panel" aria-busy={resending}>
            <div className="auth-page__field">
              <p style={{ overflowWrap: "anywhere" }}>{form.email}</p>
              <p>{t("Didn't receive your confirmation email?")}</p>
              <p>{t("Check your spam folder or request another link.")}</p>
            </div>

            {emailResent && (
              <p className="auth-page__success" role="status" aria-live="polite">
                {t(
                  "If your credentials are valid and your email is still unverified, a new confirmation link has been sent.",
                )}
              </p>
            )}

            <Button
              type="button"
              variant="primary"
              className="auth-page__submit"
              onClick={resendConfirmation}
              disabled={resending}
            >
              {resending ? <><LoadingSpinner />{t("Sending...")}</> : t("Resend confirmation email")}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="auth-page__submit"
              onClick={backToSignIn}
              disabled={resending}
              style={{ marginTop: 12 }}
            >
              {t("Back to sign in")}
            </Button>
          </section>
        )}

        {step === "login" && (
          <>
            <form onSubmit={handleSubmit} aria-busy={submitting}>
              <div className="auth-page__field">
                <label htmlFor="email">{t("auth.email")}</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                  value={form.email}
                  disabled={submitting}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="auth-page__field">
                <label htmlFor="password">{t("auth.password")}</label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  maxLength={128}
                  value={form.password}
                  disabled={submitting}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="auth-page__recaptcha">
                {recaptchaSiteKey ? (
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={recaptchaSiteKey}
                    theme="dark"
                    onChange={handleRecaptchaChange}
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
                {submitting ? <><LoadingSpinner />{t("auth.signing")}</> : t("auth.login")}
              </Button>
            </form>

            <p
              style={{
                textAlign: "center",
                marginTop: 16,
                marginBottom: 0,
              }}
            >
              <Link to="/forgot-password" style={{ color: "#888", fontSize: "0.8rem" }}>
                {t("Forgot password?")}
              </Link>
            </p>

            <p className="auth-page__footer">
              {t("auth.newTo")} <Link to={`/register?returnTo=${encodeURIComponent(from)}`} state={{ from: { pathname: from } }}>{t("auth.create")}</Link>
            </p>

            {recaptchaSiteKey && (
              <div className="auth-page__recaptcha-footer">
                <span>{t("Protected by reCAPTCHA")}</span>
              </div>
            )}
          </>
        )}

        {step === "twoFactor" && (
          <form
            onSubmit={handleTwoFactorSubmit}
            noValidate
            aria-busy={twoFactorSubmitting}
          >
            <div className="auth-page__field">
              <label htmlFor="twoFactorCode">{t("Authenticator Code")}</label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ShieldCheck
                  weight="bold"
                  size={20}
                  style={{ color: "#888", flexShrink: 0 }}
                />

                <input
                  id="twoFactorCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(event) =>
                    setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder={t("6-digit code")}
                  required
                  autoFocus
                  disabled={twoFactorSubmitting}
                />
              </div>

              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#777",
                  marginTop: 8,
                }}
              >
                {t("Enter the code from your authenticator app.")}
              </p>
            </div>

            <Button
              type="submit"
              className="auth-page__submit"
              disabled={twoFactorSubmitting}
            >
              {twoFactorSubmitting ? <><LoadingSpinner />{t("Verifying…")}</> : t("Verify & Sign In")}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="auth-page__submit"
              onClick={backToSignIn}
              disabled={twoFactorSubmitting}
              style={{ marginTop: 12 }}
            >
              {t("Back to sign in")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
