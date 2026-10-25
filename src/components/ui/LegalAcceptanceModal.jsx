import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "./Modal";

export function LegalAcceptanceModal() {
  const { t } = useLanguage();
  const location = useLocation();
  const { user, status, acceptLegalDocuments, logout } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const legalReviewPage = ["/terms", "/privacy", "/cookies", "/accessibility"].includes(location.pathname);
  const open = status === "authenticated" && user?.legalAcceptanceRequired === true && !legalReviewPage;

  useEffect(() => {
    if (!open) return;
    setTermsAccepted(false);
    setPrivacyAcknowledged(false);
    setError("");
  }, [open, user?.id]);

  async function submitAcceptance() {
    if (!termsAccepted || !privacyAcknowledged || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await acceptLegalDocuments();
    } catch {
      setError(t("Could not save your acceptance. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={() => {}} labelledBy="legal-reaccept-title">
      <div className="auth-page__legal">
        <h2 id="legal-reaccept-title">{t("Updated legal documents")}</h2>
        <p>{t("Please review the updated Terms of Service and Privacy Policy to continue using your account.")}</p>
        <p>
          <Link to="/terms" target="_blank" rel="noopener noreferrer">
            {t("Review Terms of Service")}
          </Link>
          {" · "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer">
            {t("Review Privacy Policy")}
          </Link>
        </p>
        <label>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            disabled={submitting}
          />
          <span>{t("I agree to the updated Terms of Service.")}</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={privacyAcknowledged}
            onChange={(event) => setPrivacyAcknowledged(event.target.checked)}
            disabled={submitting}
          />
          <span>{t("I acknowledge the updated Privacy Policy.")}</span>
        </label>
        {error && <p role="alert">{error}</p>}
        <p>
          <button
            type="button"
            className="btn btn--primary auth-page__submit"
            onClick={submitAcceptance}
            disabled={submitting || !termsAccepted || !privacyAcknowledged}
          >
            {t(submitting ? "Sending…" : "Accept and continue")}
          </button>
        </p>
        <p>
          <button
            type="button"
            className="btn btn--secondary auth-page__submit"
            onClick={logout}
            disabled={submitting}
          >
            {t("Sign out")}
          </button>
        </p>
        <p>
          {t("If you do not accept, you can sign out. For privacy requests, contact")}{" "}
          <a href="mailto:somiarigames@gmail.com">somiarigames@gmail.com</a>.
        </p>
      </div>
    </Modal>
  );
}
