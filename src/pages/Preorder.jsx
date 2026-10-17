import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, API_BASE_URL, friendlyErrorMessage } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";

const localeKey = (language) => ["pt-BR", "es", "en"].includes(language) ? language : "en";
const messages = {
  PREORDER_NOT_FOUND: "Pre-order not found.",
  PREORDER_NOT_OPEN: "This pre-order is not open right now.",
  PREORDER_INVALID_FORM: "Check the information you entered.",
  PREORDER_AGE_RESTRICTED: "You do not meet the eligibility requirements for this game.",
  PREORDER_ALREADY_REGISTERED: "This email is already registered for this pre-order.",
  PREORDER_CONFIRMATION_INVALID: "This confirmation link is invalid or has expired.",
  PREORDER_REWARD_NOT_FOUND: "This reward link has already been used or is invalid.",
};

const preorderStorageKey = (slug) => `deadsmile:preorder:${slug}`;
function saveConfirmedPreorder(slug) {
  try { window.localStorage.setItem(preorderStorageKey(slug), "confirmed"); } catch { /* optional UI preference */ }
}

export function Preorder() {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const { user, status: authStatus } = useAuth();
  const navigate = useNavigate();
  const locale = localeKey(language);
  const [game, setGame] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", age: "", email: "" });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);
  const [hasPreorderRecord, setHasPreorderRecord] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [saving, setSaving] = useState(false);

  const preorderPath = "/games/" + encodeURIComponent(slug) + "/preorder";
  const windowOpen = Boolean(
    game &&
    game.isFree !== false &&
    game.preorderEnabled !== false &&
    Number.isFinite(Date.parse(game.startsAt || "")) &&
    Number.isFinite(Date.parse(game.endsAt || "")) &&
    Date.now() >= Date.parse(game.startsAt) &&
    Date.now() < Date.parse(game.endsAt)
  );
  const currentStep = status === "review" ? 2 :
    ["pending-confirmation", "already-confirmed", "daily-limit", "closed-record", "closed"].includes(status) ? 3 : 1;

  const redirectToLogin = () => navigate("/login", {
    replace: true,
    state: { from: { pathname: preorderPath } },
  });

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    if (authStatus === "loading") return () => { active = false; };
    if (authStatus === "guest") {
      redirectToLogin();
      return () => { active = false; };
    }
    if (authStatus !== "authenticated" || !user?.id) {
      setError(t("Sign in to continue to pre-order."));
      setStatus("error");
      return () => { active = false; };
    }

    async function load() {
      try {
        const mine = await api.get("/preorders/" + encodeURIComponent(slug) + "/status");
        let info;
        try {
          info = await api.get("/preorders/" + encodeURIComponent(slug));
        } catch (err) {
          if (!mine.hasPreorderRecord || !["PREORDER_NOT_OPEN", "PREORDER_NOT_FOUND"].includes(err?.code)) throw err;
          info = mine.game;
        }
        if (!active) return;
        setGame(info);
        setAttemptsRemaining(Number(mine.attemptsRemaining ?? 2));
        setHasPreorderRecord(Boolean(mine.hasPreorderRecord));
        if (mine.preorderStatus === "confirmed") {
          saveConfirmedPreorder(slug);
          setStatus("already-confirmed");
        } else if (mine.preorderStatus === "pending") {
          setStatus("pending-confirmation");
        } else {
          try { window.localStorage.removeItem(preorderStorageKey(slug)); } catch { /* optional preference */ }
          const canRegister = info.isFree !== false &&
            info.preorderEnabled !== false &&
            Number.isFinite(Date.parse(info.startsAt || "")) &&
            Number.isFinite(Date.parse(info.endsAt || "")) &&
            Date.now() >= Date.parse(info.startsAt) &&
            Date.now() < Date.parse(info.endsAt);
          if (mine.preorderStatus === "expired" && !canRegister) setStatus("closed-record");
          else if (Number(mine.attemptsRemaining ?? 2) <= 0) setStatus("daily-limit");
          else if (!canRegister) setStatus("closed");
          else setStatus("details");
        }
      } catch (err) {
        if (!active) return;
        if (err?.status === 401 || err?.code === "UNAUTHENTICATED") {
          redirectToLogin();
          return;
        }
        setError(messages[err?.code] ? t(messages[err.code]) : friendlyErrorMessage(err));
        setStatus("error");
      }
    }
    void load();
    return () => { active = false; };
  }, [slug, locale, t, authStatus, user?.id, navigate]);

  // Keep the current page synchronized when the confirmation link is opened on another device.
  useEffect(() => {
    if (status !== "pending-confirmation" || authStatus !== "authenticated") return undefined;
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending || !active) return;
      pending = true;
      try {
        const mine = await api.get("/preorders/" + encodeURIComponent(slug) + "/status");
        if (!active) return;
        setAttemptsRemaining(Number(mine.attemptsRemaining ?? 2));
        setHasPreorderRecord(Boolean(mine.hasPreorderRecord));
        if (mine.preorderStatus === "confirmed") {
          saveConfirmedPreorder(slug);
          setStatus("already-confirmed");
          setError("");
        } else if (!mine.hasPreorderRecord) {
          try { window.localStorage.removeItem(preorderStorageKey(slug)); } catch { /* optional preference */ }
          setStatus(Number(mine.attemptsRemaining ?? 2) > 0 ? "details" : "daily-limit");
        }
      } catch (err) {
        if (err?.status === 401 || err?.code === "UNAUTHENTICATED") {
          if (active) redirectToLogin();
        }
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 3500);
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [status, authStatus, slug, navigate]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  function reviewDetails(event) {
    event.preventDefault();
    setError("");
    setStatus("review");
  }

  function backToDetails() {
    setError("");
    setStatus("details");
  }

  async function savePreorder() {
    if (saving || attemptsRemaining <= 0) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.post("/preorders/" + encodeURIComponent(slug), {
        ...form,
        age: Number(form.age),
        locale,
      });
      setAttemptsRemaining(Number(result?.attemptsRemaining ?? Math.max(0, attemptsRemaining - 1)));
      setHasPreorderRecord(true);
      setStatus("pending-confirmation");
    } catch (err) {
      if (err?.status === 401 || err?.code === "UNAUTHENTICATED") {
        redirectToLogin();
        return;
      }
      if (err?.code === "PREORDER_ALREADY_REGISTERED") {
        saveConfirmedPreorder(slug);
        setHasPreorderRecord(true);
        setStatus("already-confirmed");
        return;
      }
      if (err?.code === "PREORDER_AWAITING_CONFIRMATION") {
        setHasPreorderRecord(true);
        setStatus("pending-confirmation");
        return;
      }
      if (err?.code === "PREORDER_DAILY_LIMIT") {
        setAttemptsRemaining(0);
        setStatus("daily-limit");
      } else {
        setError(messages[err?.code] ? t(messages[err.code]) : friendlyErrorMessage(err));
        setStatus("review");
      }
    } finally {
      setSaving(false);
    }
  }

  async function cancelPreorder() {
    if (canceling) return;
    if (!window.confirm(t("Are you sure you want to cancel this pre-order? Your personal details and reward code will be deleted. You can sign up again, but only twice per game each day."))) return;
    setCanceling(true);
    setError("");
    try {
      const result = await api.delete("/preorders/" + encodeURIComponent(slug));
      try { window.localStorage.removeItem(preorderStorageKey(slug)); } catch { /* optional preference */ }
      setForm({ firstName: "", lastName: "", age: "", email: "" });
      setHasPreorderRecord(false);
      setAttemptsRemaining(Number(result?.attemptsRemaining ?? attemptsRemaining));
      if (Number(result?.attemptsRemaining ?? attemptsRemaining) <= 0) setStatus("daily-limit");
      else if (windowOpen) setStatus("details");
      else setStatus("closed");
    } catch (err) {
      if (err?.status === 401 || err?.code === "UNAUTHENTICATED") {
        redirectToLogin();
        return;
      }
      setError(messages[err?.code] ? t(messages[err.code]) : friendlyErrorMessage(err));
    } finally {
      setCanceling(false);
    }
  }

  if (status === "loading") return <main className="page-shell preorder-page container"><LoadingSpinner /></main>;
  if (status === "error") return (
    <main className="page-shell preorder-page container">
      <div className="preorder-workspace__error">
        <ErrorState message={error} />
        <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Back to game")}</Link>
      </div>
    </main>
  );

  const stages = [
    { number: 1, title: t("Your details"), description: t("Enter the details for your pre-order.") },
    { number: 2, title: t("Review"), description: t("Check everything before saving.") },
    { number: 3, title: t("Email confirmation"), description: t("Confirm from your inbox to finish.") },
  ];

  return (
    <main className="page-shell preorder-page container">
      <header className="preorder-workspace__header">
        {game?.coverImage && <img className="preorder-workspace__cover" src={game.coverImage} alt="" loading="eager" />}
        <div className="preorder-workspace__heading">
          <p className="news-detail__eyebrow">{t("Pre-order")}</p>
          <h1>{game?.title || t("Pre-order")}</h1>
          <p>{t("Register for this game's pre-order. When it ends, we'll email your unique reward code.")}</p>
        </div>
      </header>

      <div className="preorder-workspace">
        <aside className="preorder-workspace__sidebar" aria-label={t("Pre-order steps")}>
          <p className="preorder-workspace__eyebrow">{t("YOUR PRE-ORDER")}</p>
          <ol className="preorder-steps">
            {stages.map((stage) => {
              const complete = stage.number < currentStep || (stage.number === 3 && status === "already-confirmed");
              const active = stage.number === currentStep;
              return (
                <li key={stage.number} className={`preorder-steps__item${active ? " is-active" : ""}${complete ? " is-complete" : ""}`}>
                  <span className="preorder-steps__number">{complete ? "✓" : stage.number}</span>
                  <span className="preorder-steps__copy"><strong>{stage.title}</strong><small>{stage.description}</small></span>
                </li>
              );
            })}
          </ol>
          <p className="preorder-workspace__quota">{t("You have {{remaining}} sign-up attempt(s) left today.", { remaining: attemptsRemaining })}</p>
        </aside>

        <section className="preorder-workspace__main" aria-live="polite">
          {status === "details" && (
            <>
              <div className="preorder-workspace__stage-heading">
                <span>01 / 03</span><h2>{t("Your details")}</h2>
                <p>{t("Enter your details to join this free game's pre-order.")}</p>
              </div>
              <form className="preorder-form" onSubmit={reviewDetails}>
                <div className="preorder-form__row">
                  <label className="admin-field"><span>{t("First name")}</span><input required maxLength={100} autoComplete="given-name" value={form.firstName} onChange={update("firstName")} /></label>
                  <label className="admin-field"><span>{t("Last name")}</span><input required maxLength={100} autoComplete="family-name" value={form.lastName} onChange={update("lastName")} /></label>
                </div>
                <div className="preorder-form__row">
                  <label className="admin-field"><span>{t("Age")}</span><input required type="number" min={1} max={120} step={1} value={form.age} onChange={update("age")} /></label>
                  <label className="admin-field"><span>{t("Email address")}</span><input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={update("email")} /></label>
                </div>
                {error && <p className="account-page__error" role="alert">{error}</p>}
                <p className="preorder-workspace__hint">{t("We will email you a confirmation link first. Your pre-order is only confirmed after opening that link.")}</p>
                <div className="preorder-form__actions">
                  <button className="btn btn--primary" type="submit">{t("Continue")}</button>
                  <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Cancel")}</Link>
                </div>
              </form>
            </>
          )}

          {status === "review" && (
            <>
              <div className="preorder-workspace__stage-heading">
                <span>02 / 03</span><h2>{t("Review your pre-order")}</h2>
                <p>{t("Check that the information below is correct.")}</p>
              </div>
              <dl className="preorder-review">
                <div><dt>{t("First name")}</dt><dd>{form.firstName}</dd></div>
                <div><dt>{t("Last name")}</dt><dd>{form.lastName}</dd></div>
                <div><dt>{t("Age")}</dt><dd>{form.age}</dd></div>
                <div><dt>{t("Email address")}</dt><dd>{form.email}</dd></div>
              </dl>
              {error && <p className="account-page__error" role="alert">{error}</p>}
              <p className="preorder-workspace__hint">{t("By saving, you agree that we will use this email to confirm your pre-order and send the reward code after it ends.")}</p>
              <div className="preorder-form__actions">
                <button className="btn btn--secondary" type="button" onClick={backToDetails}>{t("Back")}</button>
                <button className="btn btn--primary" type="button" onClick={savePreorder} disabled={saving || attemptsRemaining <= 0} aria-busy={saving}>
                  {saving ? <LoadingSpinner /> : t("Save changes")}
                </button>
              </div>
            </>
          )}

          {status === "pending-confirmation" && (
            <div className="preorder-workspace__state" role="status">
              <span className="preorder-workspace__state-mark" aria-hidden="true">✉</span>
              <p className="preorder-workspace__eyebrow">{t("STEP 03 / 03")}</p>
              <h2>{t("Check your email to confirm")}</h2>
              <p>{t("We sent a confirmation link. This page checks for confirmation automatically, so keep it open. If you confirm on another device, this screen will update.")}</p>
              <div className="preorder-live-indicator"><span />{t("Waiting for email confirmation")}</div>
              {error && <p className="account-page__error" role="alert">{error}</p>}
              <div className="preorder-form__actions">
                <button className="btn btn--secondary" type="button" disabled={canceling} onClick={cancelPreorder}>{canceling ? <LoadingSpinner /> : t("Cancel pre-order")}</button>
                <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Back to game")}</Link>
              </div>
            </div>
          )}

          {status === "already-confirmed" && (
            <div className="preorder-workspace__state" role="status">
              <p className="preorder-workspace__eyebrow">{t("STEP 03 / 03")}</p>
              <h2>{t("Your pre-order is confirmed.")}</h2>
              <p>{t("Your pre-order is now linked to your account and will appear in your library, locked until the release countdown ends.")}</p>
              <button className="btn btn--primary" type="button" disabled>{t("Already in pre-order")}</button>
              <div className="preorder-form__actions">
                <button className="btn btn--secondary" type="button" disabled={canceling} onClick={cancelPreorder}>{canceling ? <LoadingSpinner /> : t("Cancel pre-order")}</button>
                <Link className="btn btn--secondary" to="/library">{t("Open library")}</Link>
              </div>
            </div>
          )}

          {status === "daily-limit" && (
            <div className="preorder-workspace__state" role="status">
              <p className="preorder-workspace__eyebrow">{t("SIGN-UP LIMIT")}</p>
              <h2>{t("You have used both pre-order sign-up attempts for this game today.")}</h2>
              <p>{t("You can sign up for this pre-order again tomorrow.")}</p>
              {hasPreorderRecord && <button className="btn btn--secondary" type="button" disabled={canceling} onClick={cancelPreorder}>{canceling ? <LoadingSpinner /> : t("Cancel pre-order")}</button>}
              <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Back to game")}</Link>
            </div>
          )}

          {status === "closed-record" && (
            <div className="preorder-workspace__state" role="status">
              <h2>{t("This pre-order is no longer open.")}</h2>
              <p>{t("You can still cancel the existing registration and delete its personal details.")}</p>
              <button className="btn btn--secondary" type="button" disabled={canceling} onClick={cancelPreorder}>{canceling ? <LoadingSpinner /> : t("Cancel pre-order")}</button>
              <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Back to game")}</Link>
            </div>
          )}

          {status === "closed" && (
            <div className="preorder-workspace__state" role="status">
              <h2>{t("This pre-order is no longer open.")}</h2>
              <p>{t("Your personal details have been deleted. You can return when a pre-order is open again.")}</p>
              <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Back to game")}</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export function PreorderConfirm() {
  const { slug, token } = useParams();
  const { t } = useLanguage();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const requestStarted = useRef("");

  useEffect(() => {
    if (requestStarted.current === token) return;
    requestStarted.current = token;
    setStatus("loading");
    setError("");
    api.post(`/preorders/confirm/${encodeURIComponent(token)}`, {})
      .then((data) => {
        saveConfirmedPreorder(data?.slug || slug);
        setStatus("success");
      })
      .catch((err) => {
        setError(messages[err?.code] ? t(messages[err.code]) : friendlyErrorMessage(err));
        setStatus("error");
      });
  }, [slug, token, t]);

  return (
    <main className="page-shell preorder-page">
      <section className="preorder-card preorder-card--message" aria-labelledby="preorder-confirm-title">
        <div className="preorder-card__brand">DEADSMILE <span>GAMES</span></div>
        {status === "loading" && <><h1 id="preorder-confirm-title">{t("Confirming your pre-order...")}</h1><LoadingSpinner /></>}
        {status === "success" && <div role="status"><h1 id="preorder-confirm-title">{t("Your pre-order is confirmed.")}</h1><p>{t("Your pre-order has been confirmed. Return to the game page to see your status.")}</p><Link className="btn btn--primary" to={`/games/${encodeURIComponent(slug)}`}>{t("Back to game")}</Link></div>}
        {status === "error" && <div role="alert"><h1 id="preorder-confirm-title">{t("Pre-order confirmation")}</h1><p>{error || t("This confirmation link is invalid or has expired.")}</p><Link className="btn btn--secondary" to={`/games/${encodeURIComponent(slug)}`}>{t("Back to game")}</Link></div>}
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
