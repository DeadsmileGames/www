import { useLanguage } from "../context/LanguageContext";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, friendlyErrorMessage } from "../services/api";
import { Button } from "../components/ui/Button";
import { ArrowLeft } from "@phosphor-icons/react";

function readResetToken() {
  return new URLSearchParams(window.location.search).get("token") || "";
}

export function ResetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [token] = useState(readResetToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const redirectTimer = useRef(null);
  const submitLock = useRef(false);
  useEffect(() => () => window.clearTimeout(redirectTimer.current), []);

  useEffect(() => {
    if (window.location.search)
      window.history.replaceState(window.history.state, "", window.location.pathname);
    if (!token) setError(friendlyErrorMessage({ code: "INVALID_TOKEN" }));
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitLock.current || done) return;
    setError(null);
    if (token.length < 32 || token.length > 128) {
      setError(friendlyErrorMessage({ code: "INVALID_TOKEN" }));
      return;
    }
    if (
      password.length < 8 ||
      password.length > 128 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(friendlyErrorMessage({ code: "PASSWORD_INVALID" }));
      return;
    }
    if (password !== confirm) {
      setError(friendlyErrorMessage({ code: "PASSWORD_MISMATCH" }));
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      redirectTimer.current = window.setTimeout(
        () => navigate("/login", { replace: true }),
        1800,
      );
    } catch (err) {
      setError(friendlyErrorMessage(err));
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
        <h1>{t("New password")}</h1>
        {done ? (
          <p style={{ color: "#79cf8a", lineHeight: 1.6 }}>
            {t("Password updated. Redirecting to sign in\u2026")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <p className="auth-page__error" role="alert">
                {t(error)}
              </p>
            )}
            <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: 20 }}>
              {t("Choose a new password for your account.")}
            </p>
            <div className="auth-page__field">
              <label htmlFor="new-password">{t("New password")}</label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="auth-page__field">
              <label htmlFor="confirm-password">{t("Confirm password")}</label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="auth-page__submit"
              disabled={submitting || !token}
            >
              {submitting ? t("Updating\u2026") : t("Update password")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
