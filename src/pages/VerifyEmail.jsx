import { useLanguage } from "../context/LanguageContext";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { api, friendlyErrorMessage } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export function VerifyEmail() {
  const { t } = useLanguage();
  const location = useLocation();
  const stateReturnTo = location.state?.from;
  const stateCandidate =
    typeof stateReturnTo === "string"
      ? stateReturnTo
      : stateReturnTo?.pathname
        ? `${stateReturnTo.pathname}${stateReturnTo.search || ""}${stateReturnTo.hash || ""}`
        : "";
  let storedReturnTo = "";
  try {
    storedReturnTo = window.localStorage.getItem("deadsmile:auth:returnTo") || "";
  } catch {
    // Local storage is optional; location state remains available.
  }
  const returnToCandidate = stateCandidate || storedReturnTo;
  const returnTo =
    returnToCandidate.startsWith("/") &&
    !returnToCandidate.startsWith("//") &&
    !returnToCandidate.includes("\\") &&
    !/[\u0000-\u001f]/.test(returnToCandidate)
      ? returnToCandidate
      : "";
  const loginPath = returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/login";
  const { refresh } = useAuth();

  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search);

    return params.get("token");
  });

  const [status, setStatus] = useState(token ? "loading" : "ready");

  const [message, setMessage] = useState(
    token
      ? t("Confirming your email...")
      : t("Check your inbox for a confirmation link."),
  );

  const attempted = useRef(false);

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }

    if (!token || attempted.current) {
      return;
    }

    attempted.current = true;

    async function confirm() {
      try {
        const result = await api.post("/auth/confirm-email", { token });

        setStatus("success");

        if (result?.emailChanged) {
          setMessage(
            t("Your email has been changed successfully. ") +
              t("Please sign in again using your new email address."),
          );
          await refresh();
        } else {
          setMessage(
            t("Your email has been confirmed! ") +
              t("You can now sign in to your account."),
          );
        }
      } catch (error) {
        setStatus("error");

        setMessage(friendlyErrorMessage(error));
      }
    }

    confirm();
  }, [token, refresh]);

  return (
    <section className="newsletter-action page-section">
      <div className="newsletter-action__card" aria-busy={status === "loading"}>
        <h1>{t("Email verification")}</h1>

        {status === "loading" && (
          <div className="save-progress" aria-hidden="true">
            <div className="save-progress__bar" />
          </div>
        )}
        <p role="status">{t(message)}</p>

        {location.state?.registered && (
          <p>
            {t(
              "Your account has been created. Confirm your email address before signing in.",
            )}
          </p>
        )}

        {status === "loading" && <p>{t("Verifying your confirmation link...")}</p>}

        {status === "error" && (
          <p>
            {t(
              "If your link has expired, return to the login page and request another one.",
            )}
          </p>
        )}

        {status !== "loading" && (
          <Link className="btn btn--primary" to={loginPath} state={returnTo ? { from: returnTo } : undefined}>
            {t("Go to login")}
          </Link>
        )}
      </div>
    </section>
  );
}
