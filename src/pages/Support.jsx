import { useLanguage } from "../context/LanguageContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CaretDown, Envelope, GameController } from "@phosphor-icons/react";
import { api, friendlyErrorMessage } from "../services/api";
import { useToast } from "../components/ui/Toast";

const faqs = [
  [
    "How are game updates installed?",
    "The launcher checks supported games before play and offers an update without replacing the active installation until the new build is ready.",
  ],
  [
    "My itch.io game is not showing. What should I do?",
    "Refresh your linked library from account settings. A game not found is shown separately from a temporary connection problem.",
  ],
  [
    "How do cloud saves work?",
    "Supported games synchronize their save before and after play. If both copies changed, the newer cloud copy is kept until you choose what to replace.",
  ],
  [
    "Where are purchases handled?",
    "Purchases are completed and owned on itch.io. Deadsmile Games stores only the verified entitlement needed for your library.",
  ],
];

export function Support() {
  const { t } = useLanguage();
  const { push } = useToast();
  const [open, setOpen] = useState(0);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ email: "", category: "technical", message: "" });
  const change = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setSending(true);
    try {
      await api.post("/support", form);
      setForm((current) => ({ ...current, message: "" }));
      push(t("Your message was sent. We will reply by email."), "success");
    } catch (error) {
      push(friendlyErrorMessage(error), "error");
    } finally {
      setSending(false);
    }
  }
  return (
    <div className="support-page container">
      
      <header className="support-hero">
        <div>
          <h1>{t("How can we help?")}</h1>
          <p>{t("Account, purchase, launcher and game support from Deadsmile Games.")}</p>
        </div>
      </header>
      <section className="support-quick-grid">
        <a href="mailto:somiarigames@gmail.com">
          <Envelope size={25} weight="bold" />
          <div>
            <strong>{t("Email support")}</strong>
            <span>somiarigames@gmail.com</span>
          </div>
          <ArrowUpRight size={18} weight="bold" />
        </a>
        <Link to="/games">
          <GameController size={25} weight="bold" />
          <div>
            <strong>{t("Game catalog")}</strong>
            <span>{t("Open a game support page")}</span>
          </div>
          <ArrowUpRight size={18} weight="bold" />
        </Link>
      </section>
      <div className="support-layout">
        <section className="support-contact-panel support-card">
          <div className="support-section-title">
            <div>
              <h2>{t("Contact support")}</h2>
              <p>
                {t(
                  "Tell us what happened. Please do not include passwords, tokens or payment details.",
                )}
              </p>
            </div>
          </div>
          <form onSubmit={submit}>
            <label>
              {t("Email")}
              <input
                type="email"
                required
                maxLength="254"
                value={form.email}
                onChange={change("email")}
                autoComplete="email"
              />
            </label>
            <label>
              {t("Category")}
              <select value={form.category} onChange={change("category")}>
                <option value="technical">{t("Technical issue")}</option>
                <option value="account">{t("Account")}</option>
                <option value="purchase">{t("Purchase")}</option>
                <option value="game">{t("Game")}</option>
                <option value="faq">{t("FAQ")}</option>
                <option value="other">{t("Other")}</option>
              </select>
            </label>
            <label>
              {t("Message")}
              <textarea
                required
                minLength="10"
                maxLength="5000"
                rows="6"
                value={form.message}
                onChange={change("message")}
                placeholder={t("What were you trying to do?")}
              />
            </label>
            <small className="support-privacy-note">
              {t("By sending this request, you acknowledge the Privacy Policy.")}{" "}
              <Link to="/privacy">{t("Privacy Policy")}</Link>
            </small>
            <button className="btn btn--primary" disabled={sending}>
              <span>{sending ? t("Sending\u2026") : t("Send message")}</span>
              <ArrowUpRight size={18} weight="bold" />
            </button>
          </form>
        </section>
        <section className="support-faq-panel support-card">
          <div className="support-section-title">
            <div>
              <h2>{t("FAQ")}</h2>
              <p>{t("Quick answers for launcher, purchases and cloud saves.")}</p>
            </div>
          </div>
          {faqs.map(([question, answer], index) => (
            <article key={question}>
              <button
                type="button"
                onClick={() => setOpen(open === index ? null : index)}
                aria-expanded={open === index}
              >
                <span>{t(question)}</span>
                <CaretDown size={18} weight="bold" />
              </button>
              {open === index && <p>{t(answer)}</p>}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
