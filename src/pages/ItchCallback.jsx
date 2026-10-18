import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, EnvelopeSimple, WarningCircle } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { api, friendlyErrorMessage } from "../services/api";

const copy = {
  en: {
    loading: "Connecting your itch.io account…",
    success: "Account connected",
    successMessage: "Your itch.io account is now connected to Deadsmile Games.",
    error: "Connection not completed",
    invalid: "This itch.io connection link is invalid or has expired. Start the connection again from your account.",
    returnToAccount: "Return to account",
  },
  "pt-BR": {
    loading: "Conectando sua conta itch.io…",
    success: "Conta conectada",
    successMessage: "Sua conta itch.io foi conectada à Deadsmile Games.",
    error: "Conexão não concluída",
    invalid: "Este link de conexão do itch.io é inválido ou expirou. Inicie a conexão novamente pela sua conta.",
    returnToAccount: "Voltar para a conta",
  },
  es: {
    loading: "Conectando tu cuenta de itch.io…",
    success: "Cuenta conectada",
    successMessage: "Tu cuenta de itch.io ya está conectada a Deadsmile Games.",
    error: "Conexión no completada",
    invalid: "Este enlace de conexión de itch.io no es válido o ha caducado. Inicia la conexión de nuevo desde tu cuenta.",
    returnToAccount: "Volver a la cuenta",
  },
};

function readOAuthPayload() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return {
    state: params.get("state") || "",
    accessToken: params.get("access_token") || "",
  };
}

export function ItchCallback() {
  const { language, t } = useLanguage();
  const [oauth] = useState(readOAuthPayload);
  const [result, setResult] = useState({ status: "loading", message: "" });
  const request = useRef(null);
  const labels = copy[language] || copy.en;
  const requestKey = oauth.state && oauth.accessToken
    ? `${oauth.state}:${oauth.accessToken}`
    : "";

  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);

    if (
      !oauth.state ||
      !/^[A-Za-z0-9_-]{40,200}$/.test(oauth.state) ||
      !oauth.accessToken ||
      oauth.accessToken.length < 20 ||
      oauth.accessToken.length > 1000
    ) {
      setResult({
        status: "error",
        message: t(labels.invalid),
      });
      return undefined;
    }

    let active = true;
    setResult({ status: "loading", message: "" });

    if (!request.current || request.current.key !== requestKey) {
      request.current = {
        key: requestKey,
        promise: api.post("/integrations/itch/complete", {
          state: oauth.state,
          accessToken: oauth.accessToken,
        }),
      };
    }

    request.current.promise
      .then(() => {
        if (!active) return;
        setResult({ status: "success", message: labels.successMessage });
      })
      .catch((error) => {
        if (!active) return;
        setResult({
          status: "error",
          message: friendlyErrorMessage(error) || labels.invalid,
        });
      });

    return () => {
      active = false;
    };
  }, [oauth.state, oauth.accessToken, requestKey, t, labels.invalid, labels.successMessage]);

  const Icon =
    result.status === "success"
      ? CheckCircle
      : result.status === "error"
        ? WarningCircle
        : EnvelopeSimple;

  return (
    <section className="newsletter-action page-section">
      <div
        className="newsletter-action__card"
        role={result.status === "error" ? "alert" : "status"}
        aria-live="polite"
        aria-busy={result.status === "loading"}
      >
        <span className={`newsletter-action__icon newsletter-action__icon--${result.status}`}>
          <Icon size={30} weight="bold" />
        </span>
        <h1>
          {result.status === "loading"
            ? labels.loading
            : result.status === "success"
              ? labels.success
              : labels.error}
        </h1>
        {result.status === "loading" ? (
          <div className="save-progress" aria-hidden="true">
            <div className="save-progress__bar" />
          </div>
        ) : (
          <p>{result.message}</p>
        )}
        {result.status !== "loading" && (
          <Link className="btn btn--primary" to="/account#games" replace>
            {labels.returnToAccount}
          </Link>
        )}
      </div>
    </section>
  );
}
