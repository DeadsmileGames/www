import { useEffect, useState } from "react";
import { CheckCircle, EnvelopeSimple, WarningCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { api, friendlyErrorMessage } from "../services/api";
import { consumeExpectedItchOAuthState } from "../utils/itchOAuth";

export function ItchOAuthCallback() {
  const { t } = useLanguage();
  const [state, setState] = useState({ status: "loading", message: "" });

  useEffect(() => {
    let active = true;
    let redirectTimer;

    async function complete() {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const oauthState = params.get("state") || "";
      const accessToken = params.get("access_token") || "";
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

      if (!consumeExpectedItchOAuthState(oauthState) || accessToken.length < 20 || accessToken.length > 1000) {
        throw { code: "ITCH_LINK_EXPIRED" };
      }

      const result = await api.post("/integrations/itch/complete", {
        state: oauthState,
        accessToken,
      });
      if (!result || result.client !== "site") throw { code: "INVALID_RESPONSE" };

      let target;
      try {
        target = new URL(result.returnUrl);
      } catch {
        target = null;
      }
      const localHttp =
        target?.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
      if (
        !target ||
        target.origin !== window.location.origin ||
        (target.protocol !== "https:" && !localHttp) ||
        target.username ||
        target.password
      ) {
        throw { code: "INVALID_RESPONSE" };
      }

      if (active) {
        setState({ status: "success", message: t("Your itch.io account is connected.") });
        redirectTimer = window.setTimeout(() => {
          window.location.replace(target.pathname + target.search + target.hash);
        }, 900);
      }
    }

    complete().catch((error) => {
      if (active) setState({ status: "error", message: friendlyErrorMessage(error) });
    });

    return () => {
      active = false;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [t]);

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
        role={state.status === "error" ? "alert" : "status"}
        aria-live="polite"
        aria-busy={state.status === "loading"}
      >
        <span className={`newsletter-action__icon newsletter-action__icon--${state.status}`}>
          <Icon size={30} weight="bold" />
        </span>
        <h1>
          {state.status === "loading"
            ? t("Connecting your itch.io account")
            : state.status === "success"
              ? t("Account connected")
              : t("Connection not completed")}
        </h1>
        {state.status === "loading" && (
          <div className="save-progress" aria-hidden="true">
            <div className="save-progress__bar" />
          </div>
        )}
        <p>{state.status === "loading" ? t("This will only take a moment.") : state.message}</p>
        {state.status !== "loading" && (
          <Link className="btn btn--primary" to="/account#games">
            {t("Return to account")}
          </Link>
        )}
      </div>
    </section>
  );
}
