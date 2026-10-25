import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "./Modal";

export function LegalAcceptanceModal() {
  const { t } = useLanguage();
  const { user, status, acceptLegalDocuments, logout } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const open = status === "authenticated" && user?.legalAcceptanceRequired === true;

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
        <div className="account-modal-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={submitAcceptance}
            disabled={submitting || !termsAccepted || !privacyAcknowledged}
          >
            {t(submitting ? "Sending…" : "Accept and continue")}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={logout}
            disabled={submitting}
          >
            {t("Sign out")}
          </button>
        </div>
        <p>{t("If you do not accept, you can sign out. For privacy requests, contact somiarigames@gmail.com.")}</p>
      </div>
    </Modal>
  );
}
