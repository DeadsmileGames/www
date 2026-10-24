import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faItchIo } from "@fortawesome/free-brands-svg-icons";
import { faInstagram, faGithub } from "@fortawesome/free-brands-svg-icons";
import { api, friendlyErrorMessage } from "../../services/api";

export function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);

  async function subscribe(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await api.post("/newsletter", {
        email: email.trim(),
        consentAccepted: newsletterConsent,
        consentTextVersion: "newsletter-consent-v2026-10-24",
      });
      setMessage(t("Request received. Check your inbox to confirm your subscription."));
      setEmail("");
      setNewsletterConsent(false);
    } catch (error) {
      setMessage(friendlyErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="studio-footer">
      <div className="container">
        <div className="newsletter">
          <h2>{t("Stay in the loop")}</h2>
          <p>{t("New games, studio news and the occasional surprise.")}</p>
          <form onSubmit={subscribe}>
            <label htmlFor="newsletter-email">{t("Your email address")}</label>
            <label className="newsletter-consent">
              <input
                type="checkbox"
                required
                checked={newsletterConsent}
                onChange={(event) => setNewsletterConsent(event.target.checked)}
                disabled={busy}
              />
              <span>{t("I agree to receive email updates from Deadsmile Games. I can unsubscribe at any time.")}</span>
            </label>
            <div className="newsletter-input">
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <button disabled={busy || !newsletterConsent}>{busy ? t("Sending\u2026") : t("Join us")}</button>
            </div>
            <p role="status">{t(message)}</p>
            <small>
              {t("Confirm by email. Unsubscribe whenever you want.")}{" "}
              <Link to="/privacy">{t("Privacy policy")}</Link>
            </small>
          </form>
        </div>

        <div className="div-socials-icons">
          <a
            href="https://instagram.com/deadsmilegames"
            aria-label="Instagram"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </a>
          <a
            href="https://deadsml.itch.io"
            aria-label="itch.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faItchIo} size="2x" />
          </a>
          <a
            href="https://github.com/deadsmilegames"
            aria-label="GitHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faGithub} size="2x" />
          </a>
        </div>

        <a className="footer-email" href="mailto:somiarigames@gmail.com">
          somiarigames@gmail.com
        </a>
        <nav className="footer-links" aria-label={t("Footer")}>
          <Link to="/games">{t("Games")}</Link>
          <Link to="/launcher">{t("Launcher")}</Link>
          <Link to="/newswire">{t("News")}</Link>
          <Link to="/about">{t("About")}</Link>
          <Link to="/specialthanks">{t("Special Thanks")}</Link>
          <Link to="/support">{t("Support")}</Link>
          <Link to="/presskit">{t("Press Kit")}</Link>
          <Link to="/privacy">{t("Privacy")}</Link>
          <Link to="/terms">{t("Terms")}</Link>
          <Link to="/cookies">{t("Cookie Policy")}</Link>
          <Link to="/accessibility">{t("Accessibility")}</Link>
        </nav>
        <p className="copyright">© {new Date().getFullYear()} Deadsmile Games</p>
      </div>
    </footer>
  );
}
