import { useLanguage } from "../context/LanguageContext";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, EnvelopeSimple, WarningCircle } from "@phosphor-icons/react";
import { api, friendlyErrorMessage } from "../services/api";

function readToken() {
  return new URLSearchParams(window.location.search).get("token") || "";
}

export function NewsletterAction({ action }) {
  const { t } = useLanguage();
  const [token] = useState(readToken);
  const [state, setState] = useState({ status: "loading", message: "" });
  const request = useRef(null);

  useEffect(() => {
    if (window.location.search)
      window.history.replaceState(window.history.state, "", window.location.pathname);
    if (!token) {
      setState({
        status: "error",
        message: friendlyErrorMessage({ code: "NEWSLETTER_LINK_INVALID" }),
      });
      return undefined;
    }
    let active = true;
    setState({ status: "loading", message: "" });
    if (!request.current || request.current.action !== action) {
      request.current = { action, promise: api.post(`/newsletter/${action}`, { token }) };
    }
    request.current.promise
      .then(() => {
        if (!active) return;
        setState({
          status: "success",
          message:
            action === "confirm"
              ? t("Your subscription is confirmed.")
              : t("You have been unsubscribed."),
        });
      })
      .catch((error) => {
        if (active) setState({ status: "error", message: friendlyErrorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [action, token]);

  const Icon =
    state.status === "success"
      ? CheckCircle
      : state.status === "error"
        ? WarningCircle
        : EnvelopeSimple;
  return (
    <section className="newsletter-action page-section">
      <div
        className="newsletter-action__card"
        role="status"
        aria-live="polite"
        aria-busy={state.status === "loading"}
      >
        <span
          className={`newsletter-action__icon newsletter-action__icon--${state.status}`}
        >
          <Icon size={30} weight="bold" />
        </span>
        <h1>
          {state.status === "loading"
            ? t("Checking your link")
            : action === "confirm"
              ? t("Newsletter confirmation")
              : t("Newsletter preferences")}
        </h1>
        {state.status === "loading" && (
          <div className="save-progress" aria-hidden="true">
            <div className="save-progress__bar" />
          </div>
        )}
        <p>
          {state.status === "loading"
            ? t("This will only take a moment.")
            : t(state.message)}
        </p>
        {state.status !== "loading" && (
          <Link className="btn btn--primary" to="/">
            {t("Return home")}
          </Link>
        )}
      </div>
    </section>
  );
}
