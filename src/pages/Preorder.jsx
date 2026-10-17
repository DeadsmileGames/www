import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, API_BASE_URL, friendlyErrorMessage } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";

const localeKey = (language) => ["pt-BR", "es", "en"].includes(language) ? language : "en";
const messages = {
  PREORDER_NOT_FOUND: "Pre-order not found.",
  PREORDER_NOT_OPEN: "This pre-order is not open right now.",
  PREORDER_INVALID_FORM: "Check the information you entered.",
  PREORDER_AGE_RESTRICTED: "You do not meet the minimum age for this game in your selected language.",
  PREORDER_ALREADY_REGISTERED: "This email is already registered for this pre-order.",
  PREORDER_REWARD_NOT_FOUND: "This reward link has already been used or is invalid.",
};

export function Preorder() {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const locale = localeKey(language);
  const [game, setGame] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", age: "", email: "" });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const minAge = Number(game?.ageRatings?.[locale] ?? 13);

  useEffect(() => {
    let active = true;
    api.get(`/preorders/${encodeURIComponent(slug)}`)
      .then((data) => { if (active) { setGame(data); setStatus("ready"); } })
      .catch((err) => { if (active) { setError(messages[err?.code] ? t(messages[err.code]) : friendlyErrorMessage(err)); setStatus("error"); } });
    return () => { active = false; };
  }, [slug, locale, t]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (Number(form.age) < minAge) {
      setError(t("You do not meet the minimum age for this game in your selected language."));
      return;
    }
    setStatus("submitting");
    try {
      await api.post(`/preorders/${encodeURIComponent(slug)}`, { ...form, age: Number(form.age), locale });
      setSuccess(true);
      setStatus("success");
    } catch (err) {
      setError(messages[err?.code] ? t(messages[err.code]) : friendlyErrorMessage(err));
      setStatus("ready");
    }
  }

  if (status === "loading") return <main className="page-shell"><LoadingSpinner /></main>;
  if (status === "error") return <main className="page-shell"><ErrorState message={error} /><Link className="btn btn--secondary" to={`/games/${slug}`}>{t("Back to game")}</Link></main>;

  return (
    <main className="page-shell">
      <section className="account-block" aria-labelledby="preorder-title">
        <div className="account-block__head">
          {game?.coverImage && <img src={game.coverImage} alt="" loading="lazy" />}
          <h1 id="preorder-title">{t("Pre-order")} — {game?.title}</h1>
          <p>{t("Register for this game's pre-order. When it ends, we'll email your unique reward code.")}</p>
        </div>
        {success ? (
          <div className="account-panel" role="status">
            <h2>{t("You're on the list!")}</h2>
            <p>{t("Your pre-order registration is confirmed. Keep an eye on your email for your unique reward code after the pre-order ends.")}</p>
            <Link className="btn btn--primary" to={`/games/${slug}`}>{t("Back to game")}</Link>
          </div>
        ) : (
          <form className="account-panel" onSubmit={submit} aria-busy={status === "submitting"}>
            <div className="admin-modal__row">
              <label className="admin-field"><span>{t("First name")}</span><input required maxLength={100} autoComplete="given-name" value={form.firstName} onChange={update("firstName")} /></label>
              <label className="admin-field"><span>{t("Last name")}</span><input required maxLength={100} autoComplete="family-name" value={form.lastName} onChange={update("lastName")} /></label>
            </div>
            <div className="admin-modal__row">
              <label className="admin-field"><span>{t("Age")}</span><input required type="number" min={1} max={120} step={1} value={form.age} onChange={update("age")} aria-describedby="preorder-age-help" /></label>
              <label className="admin-field"><span>{t("Email address")}</span><input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={update("email")} /></label>
            </div>
            <p id="preorder-age-help">{t("Minimum age in this language")}: {minAge} ({locale})</p>
            {error && <p className="account-page__error" role="alert">{error}</p>}
            <button className="btn btn--primary" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? <LoadingSpinner /> : t("Join pre-order")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export function PreorderReward() {
  const { token } = useParams();
  const { t } = useLanguage();
  const [reward, setReward] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const consumedRequest = useRef(false);
  useEffect(() => {
    if (consumedRequest.current) return undefined;
    consumedRequest.current = true;
    api.get(`/preorders/reward/${encodeURIComponent(token)}`)
      .then((data) => setReward(data))
      .catch((err) => setError(messages[err?.code] ? t(messages[err.code]) : t("This reward link has already been used or is invalid.")))
      .finally(() => setLoading(false));
    return undefined;
  }, [token, t]);

  if (loading) return <main className="page-shell"><LoadingSpinner /></main>;
  if (error || !reward) return <main className="page-shell"><ErrorState message={error || t("This reward link has already been used or is invalid.")} /></main>;
  const downloadHref = reward.downloadUrl
    ? `${API_BASE_URL.replace(/\/api\/?$/, "")}${reward.downloadUrl}`
    : null;
  return (
    <main className="page-shell">
      <section className="account-block" aria-labelledby="preorder-reward-title">
        <div className="account-block__head">
          <h1 id="preorder-reward-title">{t("Your pre-order reward")} — {reward.title}</h1>
          <p>{reward.description || t("You have successfully redeemed your reward.")}</p>
        </div>
        <div className="account-panel">
          {reward.rewardType === "wallpapers" && Array.isArray(reward.wallpapers) && (
            <div className="admin-modal__row">
              {reward.wallpapers.map((url, index) => <figure key={url}><img src={url} alt={t("Reward wallpaper") + " " + (index + 1)} loading="lazy" /><figcaption>{t("Wallpaper")} {index + 1}</figcaption></figure>)}
            </div>
          )}
          <p>{t("You redeemed your rewards. Click below to download them.")}</p>
          {downloadHref ? <a className="btn btn--primary" href={downloadHref}>{t("Download reward ZIP")}</a> : <p>{t("No downloadable file is attached to this reward.")}</p>}
        </div>
      </section>
    </main>
  );
}
