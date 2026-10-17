import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check } from "@phosphor-icons/react";
import { api, API_BASE_URL, friendlyErrorMessage } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { loadMicrosoftStoreCovers } from "../utils/microsoftStoreCover";

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
function clearConfirmedPreorder(slug) {
  try { window.localStorage.removeItem(preorderStorageKey(slug)); } catch { /* optional UI preference */ }
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
  const [rewardCode, setRewardCode] = useState("");
  const [rewardRedeemable, setRewardRedeemable] = useState(false);
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
    ["pending-confirmation", "already-confirmed", "redeemed", "daily-limit", "closed-record", "closed"].includes(status) ? 3 : 1;

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
          if (!["PREORDER_NOT_OPEN", "PREORDER_NOT_FOUND"].includes(err?.code)) throw err;
          info = mine.game;
        }
        if (!active) return;
        setGame(info);
        void loadMicrosoftStoreCovers([info], { includeUnknown: true }).then((covers) => {
          if (!active) return;
          const storeCover = covers.get(String(info.id)) || covers.get(String(info.slug));
          if (storeCover) {
            setGame((current) => current?.slug === info.slug
              ? { ...current, coverImage: storeCover }
              : current);
          }
        });
        setAttemptsRemaining(Number(mine.attemptsRemaining ?? 2));
        setHasPreorderRecord(Boolean(mine.hasPreorderRecord));
        setRewardCode(typeof mine.rewardCode === "string" ? mine.rewardCode : "");
        setRewardRedeemable(Boolean(mine.rewardRedeemable));
        if (mine.preorderStatus === "confirmed") {
          if (mine.rewardRedeemed) {
            clearConfirmedPreorder(slug);
            setStatus("redeemed");
          } else {
            saveConfirmedPreorder(slug);
            setStatus("already-confirmed");
          }
        } else if (mine.preorderStatus === "pending") {
          setStatus("pending-confirmation");
        } else {
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
    if (!["pending-confirmation", "already-confirmed"].includes(status) || authStatus !== "authenticated") return undefined;
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
        setRewardCode(typeof mine.rewardCode === "string" ? mine.rewardCode : "");
        setRewardRedeemable(Boolean(mine.rewardRedeemable));
        if (mine.preorderStatus === "confirmed") {
          if (mine.rewardRedeemed) {
            clearConfirmedPreorder(slug);
            setStatus("redeemed");
          } else {
            saveConfirmedPreorder(slug);
            setStatus("already-confirmed");
          }
          setError("");
        } else if (!mine.hasPreorderRecord) {
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
      setRewardCode("");
      setRewardRedeemable(false);
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
      clearConfirmedPreorder(slug);
      setForm({ firstName: "", lastName: "", age: "", email: "" });
      setHasPreorderRecord(false);
      setRewardCode("");
      setRewardRedeemable(false);
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

  if (status === "loading") return <main className="page-shell preorder-page container"><div className="page-loading-state" role="status" aria-label={t("Loading")}><LoadingSpinner /></div></main>;
  if (status === "error") return (
    <main className="page-shell preorder-page container">
      <div className="preorder-workspace__error">
        <ErrorState message={error} />
        <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Back to game")}</Link>
      </div>
    </main>
  );

  const stages = [
    { number: 1, title: t("Your details") },
    { number: 2, title: t("Review") },
    { number: 3, title: t("Email confirmation") },
  ];

  return (
    <main className="page-shell preorder-page container">
      <header className="news-detail__header preorder-workspace__header">
        {game?.coverImage && <img className="preorder-workspace__cover" src={game.coverImage} alt="" loading="eager" />}
        <div className="preorder-workspace__heading">
          <p className="news-detail__eyebrow">{t("Pre-order")}</p>
          <h1>{game?.title || t("Pre-order")}</h1>
          <p className="news-detail__lead">{t("Confirm your email to get your reward code. It will appear here and become redeemable when the pre-order ends.")}</p>
        </div>
      </header>

      <div className="preorder-workspace">
        <aside className="preorder-workspace__sidebar support-card support-faq-panel" aria-label={t("Pre-order steps")}>
          <p className="preorder-workspace__steps-title">{t("Pre-order steps")}</p>
          <ol className="preorder-steps">
            {stages.map((stage) => {
              const complete = stage.number < currentStep || (stage.number === 3 && ["already-confirmed", "redeemed"].includes(status));
              const active = stage.number === currentStep;
              return (
                <li key={stage.number} className={`preorder-steps__item${active ? " is-active" : ""}${complete ? " is-complete" : ""}`}>
                  <span className="preorder-steps__number">{complete ? <Check size={15} weight="bold" aria-hidden="true" /> : String(stage.number).padStart(2, "0")}</span>
                  <span className="preorder-steps__copy"><strong>{stage.title}</strong></span>
                </li>
              );
            })}
          </ol>
          <p className="preorder-workspace__quota">{t("You have {remaining} sign-up attempt(s) left today.", { remaining: attemptsRemaining })}</p>
        </aside>

        <section className="preorder-workspace__main news-detail__content" aria-live="polite">
          <div className="news-detail__body support-card support-contact-panel">
          {status === "details" && (
            <>
              <div className="news-detail__header preorder-workspace__stage-heading">
                <h2>{t("Your details")}</h2>
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
                <p className="preorder-workspace__hint support-card support-faq-panel">{t("We will email you a confirmation link first. Your pre-order is only confirmed after opening that link.")}</p>
                <div className="preorder-form__actions">
                  <button className="btn btn--primary" type="submit">{t("Continue")}</button>
                  <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Cancel")}</Link>
                </div>
              </form>
            </>
          )}

          {status === "review" && (
            <>
              <div className="news-detail__header preorder-workspace__stage-heading">
                <h2>{t("Review your pre-order")}</h2>
                <p>{t("Check that the information below is correct.")}</p>
              </div>
              <dl className="preorder-review">
                <div><dt>{t("First name")}</dt><dd>{form.firstName}</dd></div>
                <div><dt>{t("Last name")}</dt><dd>{form.lastName}</dd></div>
                <div><dt>{t("Age")}</dt><dd>{form.age}</dd></div>
                <div><dt>{t("Email address")}</dt><dd>{form.email}</dd></div>
              </dl>
              {error && <p className="account-page__error" role="alert">{error}</p>}
              <p className="preorder-workspace__hint support-card support-faq-panel">{t("After confirming your email, your reward code will appear here. It becomes redeemable when the pre-order ends; we will not email the code.")}</p>
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
              <h2>{t("Your pre-order is confirmed.")}</h2>
              <p>{t("Your pre-order is now linked to your account and will appear in your library, locked until the release countdown ends.")}</p>
              {rewardRedeemable && rewardCode ? (
                <div className="preorder-workspace__hint support-card support-faq-panel">
                  <p><strong>{t("Your reward code")}</strong></p>
                  <p><code style={{ fontSize: "1.4rem", letterSpacing: "0.25em", fontWeight: 700 }}>{rewardCode}</code></p>
                  <p>{t("The pre-order has ended. You can redeem this code from your account.")}</p>
                </div>
              ) : (
                <p className="preorder-workspace__hint support-card support-faq-panel">{t("Your reward code will appear here when the pre-order ends.")}</p>
              )}
              <button className="btn btn--primary" type="button" disabled>{t("Already in pre-order")}</button>
              <div className="preorder-form__actions">
                <button className="btn btn--secondary" type="button" disabled={canceling} onClick={cancelPreorder}>{canceling ? <LoadingSpinner /> : t("Cancel pre-order")}</button>
                <Link className="btn btn--secondary" to="/library">{t("Open library")}</Link>
              </div>
            </div>
          )}

          {status === "redeemed" && (
            <div className="preorder-workspace__state" role="status">
              <h2>{t("Reward already redeemed")}</h2>
              <p>{t("Your reward has been redeemed. Your pre-order code and personal details have been deleted.")}</p>
              <div className="preorder-form__actions">
                <Link className="btn btn--primary" to={"/games/" + encodeURIComponent(slug) + "/preorder/reward"}>{t("Your pre-order reward")}</Link>
                <Link className="btn btn--secondary" to="/library">{t("Open library")}</Link>
                <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Back to game")}</Link>
              </div>
            </div>
          )}

          {status === "daily-limit" && (
            <div className="preorder-workspace__state" role="status">
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
          </div>
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
    <main className="page-shell preorder-page container">
      <section className="preorder-workspace__state support-card support-faq-panel" aria-labelledby="preorder-confirm-title" role={status === "error" ? "alert" : "status"}>
        {status === "loading" && <><h1 id="preorder-confirm-title">{t("Confirming your pre-order...")}</h1><LoadingSpinner /></>}
        {status === "success" && <><h1 id="preorder-confirm-title">{t("Your pre-order is confirmed.")}</h1><p>{t("Your email is confirmed. The reward code will appear on the management page when the pre-order ends.")}</p><Link className="btn btn--primary" to={`/games/${encodeURIComponent(slug)}/preorder`}>{t("Manage pre-order")}</Link><Link className="btn btn--secondary" to={`/games/${encodeURIComponent(slug)}`}>{t("Back to game")}</Link></>}
        {status === "error" && <><h1 id="preorder-confirm-title">{t("Pre-order confirmation")}</h1><p>{error || t("This confirmation link is invalid or has expired.")}</p><Link className="btn btn--secondary" to={`/games/${encodeURIComponent(slug)}`}>{t("Back to game")}</Link></>}
      </section>
    </main>
  );
}

export function PreorderReward() {
  const { slug, token } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reward, setReward] = useState(null);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setReward(null);
    setError("");
    const path = token
      ? `/preorders/reward/${encodeURIComponent(token)}`
      : `/preorders/${encodeURIComponent(slug)}/reward`;
    api.get(path)
      .then((data) => { if (active) setReward(data); })
      .catch((err) => {
        if (active) setError(messages[err?.code] ? t(messages[err.code]) : t("This reward link has already been used or is invalid."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, token, t]);

  if (loading) return <main className="page-shell preorder-page container"><div className="page-loading-state" role="status" aria-label={t("Loading")}><LoadingSpinner /></div></main>;
  if (error || !reward) return (
    <main className="page-shell preorder-page container">
      <section className="preorder-workspace__state support-card support-faq-panel" role="alert">
        <ErrorState message={error || t("This reward link has already been used or is invalid.")} />
        {slug && <Link className="btn btn--secondary" to={"/games/" + encodeURIComponent(slug)}>{t("Back to game")}</Link>}
      </section>
    </main>
  );
  const downloadHref = reward.downloadUrl
    ? reward.downloadUrl.startsWith("/api/")
      ? `${API_BASE_URL.replace(/\/api\/?$/, "")}${reward.downloadUrl}`
      : `${API_BASE_URL}${reward.downloadUrl.startsWith("/") ? "" : "/"}${reward.downloadUrl}`
    : null;

  async function downloadReward() {
    if (!downloadHref || downloadBusy) return;
    setDownloadBusy(true);
    setDownloadError("");
    try {
      const response = await fetch(downloadHref, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/zip, application/json" },
      });
      if (response.status === 401) {
        navigate("/login", {
          state: { from: { pathname: window.location.pathname } },
        });
        return;
      }
      if (!response.ok) {
        let code = "UNKNOWN_ERROR";
        try {
          const payload = await response.clone().json();
          code = payload?.error?.code || code;
        } catch { /* The endpoint may return a non-JSON error. */ }
        setDownloadError(friendlyErrorMessage({ code, status: response.status }));
        return;
      }
      const blob = await response.blob();
      if (!blob.size) {
        setDownloadError(t("The download failed. Please try again."));
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "deadsmile-preorder-reward.zip";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setDownloadError(t("The download failed. Please try again."));
    } finally {
      setDownloadBusy(false);
    }
  }

  return (
    <main className="page-shell preorder-page container">
      <section className="preorder-workspace__state support-card support-faq-panel" aria-labelledby="preorder-reward-title">
        <div className="preorder-workspace__stage-heading">
          <h2 id="preorder-reward-title">{t("Your pre-order reward")} — {reward.title}</h2>
          <p>{reward.description || t("You have successfully redeemed your reward.")}</p>
        </div>
        {reward.rewardType === "wallpapers" && Array.isArray(reward.wallpapers) && (
          <div className="admin-modal__row">
            {reward.wallpapers.map((url, index) => <figure key={url}><img src={url} alt={t("Reward wallpaper") + " " + (index + 1)} loading="lazy" /><figcaption>{t("Wallpaper")} {index + 1}</figcaption></figure>)}
          </div>
        )}
        <div className="account-panel">
          <p>{t("You redeemed your rewards. Click below to download them.")}</p>
          {downloadHref ? (
            <div className="preorder-form__actions">
              <button className="btn btn--primary" type="button" onClick={downloadReward} disabled={downloadBusy}>
                {downloadBusy ? <LoadingSpinner /> : t("Download reward ZIP")}
              </button>
            </div>
          ) : <p>{t("No downloadable file is attached to this reward.")}</p>}
          {downloadError && <p className="account-page__error" role="alert">{downloadError}</p>}
        </div>
      </section>
    </main>
  );
}
