import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  GearSix,
  GameController,
  ShieldCheck,
  Heart,
  Eye,
  PencilSimple,
  ArrowCounterClockwise,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  LockKey,
  CaretRight,
  X,
  Desktop,
  DeviceMobile,
} from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { AutoLinkText } from "../components/ui/AutoLinkText";
import { useAuth } from "../hooks/useAuth";
import { api, friendlyErrorMessage } from "../services/api";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonRows } from "../components/ui/Skeleton";
import { CloudSaves } from "../components/account/CloudSaves";
import { safeImageUrl, safeOAuthItchUrl } from "../utils/urls";
import { FOCUSABLE_SELECTOR, lockBodyScroll } from "../utils/dom";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: GearSix },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "games", label: "Games & saves", icon: GameController },
];

const CROP_VIEWPORT = 260;
const OUTPUT_SIZE = 420;

export function Account() {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() =>
    TABS.some((tab) => tab.id === location.hash.slice(1))
      ? location.hash.slice(1)
      : "profile",
  );

  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    bio: user?.bio || "",
    websiteUrl: user?.websiteUrl || "",
    location: user?.location || "",
    avatarUrl: user?.avatarUrl || null,
  });

  const [password, setPassword] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [privacy, setPrivacy] = useState({
    shareGameActivity: false,
    sharePlaytime: false,
    shareAchievements: false,
  });
  const [privacyLoading, setPrivacyLoading] = useState(true);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState("");
  const [privacyError, setPrivacyError] = useState("");
  const [privacyRevision, setPrivacyRevision] = useState(0);

  const [twoFactor, setTwoFactor] = useState({
    qrCode: null,
    secret: null,
    enabled: false,
  });
  const [totpToken, setTotpToken] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    loading: true,
    error: "",
  });
  const [twoFactorRevision, setTwoFactorRevision] = useState(0);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [sessionsMessage, setSessionsMessage] = useState("");
  const [revokingSessionId, setRevokingSessionId] = useState(null);

  const [itch, setItch] = useState({ loading: true, connected: false });
  const [itchBusy, setItchBusy] = useState(false);
  const [itchMessage, setItchMessage] = useState("");

  const [avatarDraft, setAvatarDraft] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);
  const modalRef = useRef(null);

  const [saveModal, setSaveModal] = useState({
    open: false,
    status: "saving",
    title: "",
    message: "",
  });

  useEffect(() => {
    setActiveTab(
      TABS.some((tab) => tab.id === location.hash.slice(1))
        ? location.hash.slice(1)
        : "profile",
    );
  }, [location.hash]);

  useEffect(() => {
    let cancelled = false;

    async function loadPrivacy() {
      setPrivacyLoading(true);
      setPrivacyError("");

      try {
        const result = await api.get("/account/privacy");
        if (cancelled) return;

        setPrivacy({
          shareGameActivity: Boolean(result.shareGameActivity),
          sharePlaytime: Boolean(result.sharePlaytime),
          shareAchievements: Boolean(result.shareAchievements),
        });
      } catch (error) {
        if (!cancelled) setPrivacyError(friendlyErrorMessage(error));
      } finally {
        if (!cancelled) setPrivacyLoading(false);
      }
    }

    loadPrivacy();

    return () => {
      cancelled = true;
    };
  }, [privacyRevision]);

  useEffect(() => {
    let cancelled = false;

    async function loadTwoFactorStatus() {
      setTwoFactorStatus({ loading: true, error: "" });

      try {
        const data = await api.get("/account/totp/status");
        if (typeof data?.enabled !== "boolean") {
          throw { code: "INVALID_RESPONSE" };
        }

        if (!cancelled) {
          setTwoFactor((current) => ({
            ...current,
            enabled: data.enabled,
            qrCode: data.enabled ? null : current.qrCode,
            secret: data.enabled ? null : current.secret,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setTwoFactorStatus({
            loading: false,
            error: friendlyErrorMessage(error),
          });
        }
      } finally {
        if (!cancelled) {
          setTwoFactorStatus((current) => ({ ...current, loading: false }));
        }
      }
    }

    loadTwoFactorStatus();

    return () => {
      cancelled = true;
    };
  }, [twoFactorRevision]);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/integrations/itch")
      .then((data) => {
        if (!cancelled) setItch({ ...data, loading: false });
      })
      .catch(() => {
        if (!cancelled) {
          setItch({
            loading: false,
            connected: false,
            unavailable: true,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "security" || !user?.id) return undefined;

    let cancelled = false;

    async function loadSessions() {
      setSessionsLoading(true);
      setSessionsLoaded(false);
      setSessionsError("");
      setSessionsMessage("");

      try {
        const result = await api.get("/account/sessions");
        if (cancelled) return;

        setSessions(Array.isArray(result?.sessions) ? result.sessions : []);
        setSessionsLoaded(true);
      } catch (error) {
        if (!cancelled) {
          setSessions([]);
          setSessionsError(friendlyErrorMessage(error));
        }
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (!avatarDraft && !saveModal.open) return undefined;

    const previousFocus = document.activeElement;
    const unlock = lockBodyScroll();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (avatarDraft) {
          cancelCrop();
        } else if (saveModal.status !== "saving") {
          closeSaveModal();
        }
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = [...modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
        (element) => element instanceof HTMLElement && !element.hasAttribute("disabled"),
      );

      if (!focusable.length) {
        event.preventDefault();
        modalRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    modalRef.current?.focus();

    return () => {
      unlock();
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [avatarDraft, saveModal.open, saveModal.status]);

  if (!user) return null;

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function refreshSessions() {
    if (sessionsLoading || revokingSessionId) return;

    setSessionsLoading(true);
    setSessionsError("");
    setSessionsMessage("");

    try {
      const result = await api.get("/account/sessions");
      setSessions(Array.isArray(result?.sessions) ? result.sessions : []);
      setSessionsLoaded(true);
    } catch (error) {
      setSessionsError(friendlyErrorMessage(error));
    } finally {
      setSessionsLoading(false);
    }
  }

  async function revokeDeviceSession(session) {
    if (!session?.id || session.isCurrent || revokingSessionId) return;
    if (!window.confirm(t("Disconnect this device? It will need to sign in again."))) {
      return;
    }

    setRevokingSessionId(session.id);
    setSessionsError("");
    setSessionsMessage("");

    try {
      await api.delete(`/account/sessions/${encodeURIComponent(session.id)}`);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      setSessionsMessage(t("The selected device has been disconnected."));
    } catch (error) {
      setSessionsError(friendlyErrorMessage(error));
    } finally {
      setRevokingSessionId(null);
    }
  }

  async function setupTwoFactor() {
    if (twoFactorLoading || twoFactorStatus.loading || twoFactorStatus.error) return;

    setSettingsError("");
    setTwoFactorLoading(true);

    try {
      const data = await api.post("/account/totp/setup");
      setTwoFactor({
        qrCode: data.qrCodeDataUrl,
        secret: data.secret,
        enabled: false,
      });
    } catch (error) {
      setSettingsError(friendlyErrorMessage(error));
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function enableTwoFactor(event) {
    event.preventDefault();
    if (twoFactorLoading) return;

    setSettingsError("");
    setTwoFactorLoading(true);

    try {
      await api.post("/account/totp/enable", { token: totpToken });
      setTwoFactor({ qrCode: null, secret: null, enabled: true });
      setTotpToken("");
    } catch (error) {
      setSettingsError(friendlyErrorMessage(error));
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function disableTwoFactor(event) {
    event.preventDefault();
    if (twoFactorLoading) return;
    if (!window.confirm(t("Disable 2FA? You will lose the extra security."))) return;

    setSettingsError("");
    setTwoFactorLoading(true);

    try {
      await api.delete("/account/totp/disable", { token: totpToken });
      setTwoFactor({ qrCode: null, secret: null, enabled: false });
      setTotpToken("");
    } catch (error) {
      setSettingsError(friendlyErrorMessage(error));
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function withSaveModal(title, setFlag, action) {
    setFlag(true);
    setSaveModal({ open: true, status: "saving", title, message: "" });

    try {
      await action();
      setSaveModal({
        open: true,
        status: "success",
        title,
        message: t("Changes saved."),
      });

      setTimeout(() => {
        setSaveModal((current) => ({ ...current, open: false }));
      }, 1300);
    } catch (error) {
      setSaveModal({
        open: true,
        status: "error",
        title,
        message: friendlyErrorMessage(error),
      });
    } finally {
      setFlag(false);
    }
  }

  function closeSaveModal() {
    setSaveModal((current) => ({ ...current, open: false }));
  }

  async function onAvatarSelect(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5_000_000
    ) {
      setProfileError(friendlyErrorMessage({ code: "IMAGE_INVALID" }));
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (result) => resolve(result.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
      });

      setRotation(0);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setAvatarDraft({
        src: dataUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setProfileError("");
    } catch (error) {
      setProfileError(friendlyErrorMessage(error));
    }
  }

  function coverScaleFor(draft) {
    return Math.max(CROP_VIEWPORT / draft.width, CROP_VIEWPORT / draft.height);
  }

  function onDragStart(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      startX: event.clientX - pan.x,
      startY: event.clientY - pan.y,
    };
  }

  function onDragMove(event) {
    if (!dragState.current) return;
    setPan({
      x: event.clientX - dragState.current.startX,
      y: event.clientY - dragState.current.startY,
    });
  }

  function onDragEnd() {
    dragState.current = null;
  }

  function cancelCrop() {
    setAvatarDraft(null);
  }

  function applyCrop() {
    if (!avatarDraft) return;

    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const context = canvas.getContext("2d");
      const scale = OUTPUT_SIZE / CROP_VIEWPORT;
      const displayScale = coverScaleFor(avatarDraft) * zoom;

      context.save();
      context.translate(OUTPUT_SIZE / 2 + pan.x * scale, OUTPUT_SIZE / 2 + pan.y * scale);
      context.rotate((rotation * Math.PI) / 180);
      context.scale(displayScale * scale, displayScale * scale);
      context.drawImage(image, -avatarDraft.width / 2, -avatarDraft.height / 2);
      context.restore();

      const finalUrl = [0.88, 0.76, 0.64, 0.52]
        .map((quality) => canvas.toDataURL("image/jpeg", quality))
        .find((value) => value.length <= 500_000);

      if (!finalUrl) {
        setProfileError(friendlyErrorMessage({ code: "PAYLOAD_TOO_LARGE" }));
        return;
      }

      setForm((current) => ({ ...current, avatarUrl: finalUrl }));
      setAvatarDraft(null);
    };

    image.src = avatarDraft.src;
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileError("");

    await withSaveModal(t("Saving profile"), setSaving, async () => {
      await api.patch("/account", {
        username: form.username,
        bio: form.bio,
        websiteUrl: form.websiteUrl,
        location: form.location,
        avatarUrl: form.avatarUrl,
      });
      await refresh();
    });
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSettingsError("");
    setEmailMessage("");

    const newEmail = form.email.trim().toLowerCase();
    const currentEmail = user.email.trim().toLowerCase();

    if (newEmail === currentEmail) {
      setSettingsError(friendlyErrorMessage({ code: "EMAIL_UNCHANGED" }));
      return;
    }

    if (!emailPassword) {
      setSettingsError(friendlyErrorMessage({ code: "VALIDATION_ERROR" }));
      return;
    }

    setSaving(true);

    try {
      await api.post("/account/email/change", {
        email: newEmail,
        password: emailPassword,
      });
      setEmailPassword("");
      setEmailMessage(
        t("A confirmation link has been sent to ") +
          newEmail +
          t(". Your current email address will remain ") +
          t("active until you confirm the new one."),
      );
    } catch (error) {
      setSettingsError(friendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function savePrivacy() {
    if (privacySaving || privacyLoading) return;

    setPrivacySaving(true);
    setPrivacyMessage("");
    setPrivacyError("");

    try {
      const result = await api.put("/account/privacy", {
        shareGameActivity: privacy.shareGameActivity,
        sharePlaytime: privacy.shareGameActivity && privacy.sharePlaytime,
        shareAchievements: privacy.shareAchievements,
      });

      setPrivacy({
        shareGameActivity: Boolean(result.shareGameActivity),
        sharePlaytime: Boolean(result.sharePlaytime),
        shareAchievements: Boolean(result.shareAchievements),
      });

      await refresh();
      setPrivacyMessage(t("Your privacy preferences have been saved."));
    } catch (error) {
      setPrivacyError(friendlyErrorMessage(error));
    } finally {
      setPrivacySaving(false);
    }
  }

  async function del(event) {
    event.preventDefault();
    setDeleteError("");

    await withSaveModal(t("Deleting account"), setDeleting, async () => {
      await api.delete("/account", { password });
      await logout();
      navigate("/", { replace: true });
    });
  }

  async function signOut() {
    await withSaveModal(t("Log out"), setSaving, async () => {
      await logout();
      navigate("/", { replace: true });
    });
  }

  async function connectItch() {
    setItchBusy(true);
    setItchMessage("");

    try {
      const result = await api.post("/integrations/itch/connect", {
        client: "site",
        locale: language,
        returnPath: "/account#games",
      });

      const authorizeUrl = safeOAuthItchUrl(result.authorizeUrl);
      if (!authorizeUrl) throw { code: "INVALID_RESPONSE" };

      window.location.assign(authorizeUrl);
    } catch (error) {
      setItchMessage(friendlyErrorMessage(error));
      setItchBusy(false);
    }
  }

  async function syncItch() {
    setItchBusy(true);
    setItchMessage("");

    try {
      await api.post("/library/sync");
      const status = await api.get("/integrations/itch");
      setItch({ ...status, loading: false });
      setItchMessage(t("Your itch.io library is up to date."));
    } catch (error) {
      setItchMessage(friendlyErrorMessage(error));
    } finally {
      setItchBusy(false);
    }
  }

  async function disconnectItch() {
    if (!window.confirm(t("Disconnect itch.io from your Deadsmile Games account?"))) {
      return;
    }

    setItchBusy(true);
    setItchMessage("");

    try {
      await api.delete("/integrations/itch");
      setItch({ loading: false, connected: false, configured: true });
      setItchMessage(t("Your itch.io account was disconnected."));
    } catch (error) {
      setItchMessage(friendlyErrorMessage(error));
    } finally {
      setItchBusy(false);
    }
  }

  const avatar = safeImageUrl(form.avatarUrl);
  const createdAt = user.createdAt ? new Date(user.createdAt) : null;
  const createdDate =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleDateString(language, {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      : null;

  return (
    <div className="account-page container">
      <Link to="/" className="back-link">
        <ArrowLeft weight="bold" />
        <span>{t("Back")}</span>
      </Link>

      <h1>{t("Account")}</h1>

      <header className="profile-page__hero">
        <div className="account-page__avatar">
          <div className="account-page__avatar-inner">
            {avatar ? (
              <img src={avatar} alt="" />
            ) : (
              user.username.slice(0, 1).toUpperCase()
            )}
          </div>

          <label className="avatar-upload-dot" aria-label={t("Adjust photo")}>
            <PencilSimple size={20} weight="bold" />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label={t("Adjust photo")}
              disabled={saving || deleting}
              onChange={(event) => {
                navigate("/account#profile", { replace: true });
                onAvatarSelect(event);
              }}
            />
          </label>
        </div>

        <div>
          <h2>{user.username}</h2>

          {user.bio && (
            <p>
              <AutoLinkText>{user.bio}</AutoLinkText>
            </p>
          )}

          <div className="profile-page__facts">
            {createdDate && (
              <span>
                {t("Created on")} {createdDate}
              </span>
            )}
            {user.location && <span>{user.location}</span>}
          </div>
        </div>
      </header>

      <div className="account-page__layout">
        <nav aria-label={t("Account")}>
          {TABS.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                className={`account-nav-item${activeTab === tab.id ? " is-active" : ""}`}
                aria-current={activeTab === tab.id ? "page" : undefined}
                aria-controls="account-tab-content"
                onClick={() => navigate(`/account#${tab.id}`, { replace: true })}
              >
                <Icon weight="bold" />
                <span>{t(tab.label)}</span>
              </button>
            );
          })}

          <span className="account-nav-title">{t("Related")}</span>

          <Link to="/wishlist" className="account-nav-item account-page__wishlist">
            <Heart weight="bold" />
            <span>{t("Wishlist")}</span>
          </Link>
        </nav>

        <div className="account-page__content">
          <div id="account-tab-content" className="support-faq-panel support-card">
            {activeTab === "profile" && (
              <section className="account-block" aria-labelledby="account-profile-title">
                <div className="account-block__head">
                  <h2 id="account-profile-title">{t("Profile Details")}</h2>
                  <p>{t("Manage how your public profile appears across the site.")}</p>
                </div>

                <form className="account-panel" onSubmit={saveProfile} aria-busy={saving}>
                  <div className="account-row">
                    <label htmlFor="acc-username">{t("Username")}</label>
                    <input
                      id="acc-username"
                      value={form.username}
                      onChange={set("username")}
                      placeholder="@username"
                      autoComplete="username"
                      required
                      minLength={3}
                      maxLength={24}
                      pattern="[A-Za-z0-9_]{3,24}"
                      disabled={saving}
                    />
                  </div>

                  <div className="account-row">
                    <label htmlFor="acc-bio">{t("Bio")}</label>
                    <textarea
                      id="acc-bio"
                      value={form.bio}
                      onChange={set("bio")}
                      placeholder={t("Write something about yourself.")}
                      maxLength={500}
                      rows={3}
                      disabled={saving}
                    />
                  </div>

                  <div className="account-row">
                    <label htmlFor="acc-website">{t("Website")}</label>
                    <input
                      id="acc-website"
                      type="url"
                      maxLength={2000}
                      value={form.websiteUrl}
                      onChange={set("websiteUrl")}
                      placeholder="https://…"
                      disabled={saving}
                    />
                  </div>

                  <div className="account-row">
                    <label htmlFor="acc-location">{t("Location")}</label>
                    <input
                      id="acc-location"
                      maxLength={120}
                      value={form.location}
                      onChange={set("location")}
                      placeholder={t("City, Country")}
                      disabled={saving}
                    />
                  </div>

                  {profileError && (
                    <p className="account-page__error" role="alert">
                      {profileError}
                    </p>
                  )}

                  <div className="account-block__foot">
                    <Button type="submit" variant="primary" disabled={saving} loading={saving}>
                      {saving ? t("Saving...") : t("Save profile")}
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {activeTab === "account" && (
              <>
                <section
                  className="account-block"
                  aria-labelledby="account-language-title"
                >
                  <div className="account-block__head">
                    <h2 id="account-language-title">{t("Language")}</h2>
                  </div>

                  <div className="account-row account-row--inline">
                    <label htmlFor="acc-language">{t("Language")}</label>
                    <select
                      id="acc-language"
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                      style={{ width: "min(100%, 280px)" }}
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="pt-BR">Português (Brasil)</option>
                    </select>
                  </div>
                </section>

                <section className="account-block" aria-labelledby="account-email-title">
                  <div className="account-block__head">
                    <h2 id="account-email-title">{t("Email")}</h2>
                    <p>
                      {t(
                        "Enter your new email address and your current password to request the change.",
                      )}
                    </p>
                  </div>

                  <form
                    className="account-panel"
                    onSubmit={saveSettings}
                    aria-busy={saving}
                  >
                    <div className="account-row">
                      <label htmlFor="acc-email">{t("Email")}</label>
                      <input
                        id="acc-email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        value={form.email}
                        onChange={set("email")}
                        disabled={saving}
                      />
                      <p>
                        {t("Current email: ")}
                        {user.email}
                      </p>
                    </div>

                    <div className="account-row">
                      <label htmlFor="acc-email-password">
                        {t("Current account password")}
                      </label>
                      <input
                        id="acc-email-password"
                        type="password"
                        required
                        minLength={1}
                        maxLength={128}
                        autoComplete="current-password"
                        value={emailPassword}
                        onChange={(event) => setEmailPassword(event.target.value)}
                        disabled={saving}
                      />
                    </div>

                    {settingsError && (
                      <p className="account-page__error" role="alert">
                        {settingsError}
                      </p>
                    )}

                    {emailMessage && (
                      <p className="account-page__success" role="status">
                        {emailMessage}
                      </p>
                    )}

                    <div className="account-block__foot">
                      <Button type="submit" variant="primary" disabled={saving} loading={saving}>
                        {saving
                          ? t("Sending confirmation...")
                          : t("Request email change")}
                      </Button>
                    </div>
                  </form>
                </section>

                <section
                  className="account-block"
                  aria-labelledby="account-session-title"
                >
                  <div className="account-block__head">
                    <h2 id="account-session-title">{t("Account")}</h2>
                  </div>

                  <div className="account-row account-row--inline">
                    <div>
                      <strong>{t("Password recovery")}</strong>
                      <p>{t("Reset your password.")}</p>
                    </div>
                    <Link to="/forgot-password" className="btn btn--secondary">
                      <LockKey size={20} weight="bold" />
                      {t("Reset your password.")}
                      <CaretRight size={18} />
                    </Link>
                  </div>

                  <div className="account-row account-row--inline">
                    <div>
                      <strong>{t("Session")}</strong>
                      <p>{t("Sign out from this device.")}</p>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={signOut}
                      disabled={saving || deleting}
                    >
                      {t("Log out")}
                    </Button>
                  </div>
                </section>

                <section className="account-block" aria-labelledby="account-delete-title">
                  <div className="account-block__head account-block__head--danger">
                    <h2 id="account-delete-title">{t("Delete account")}</h2>
                    <p>
                      {t(
                        "This is permanent. You will lose access to your public profile and cannot undo this action.",
                      )}
                    </p>
                  </div>

                  <form
                    className="account-panel account-panel--danger"
                    onSubmit={del}
                    aria-busy={deleting}
                  >
                    <div className="account-row">
                      <label htmlFor="acc-password">{t("Current password")}</label>
                      <input
                        id="acc-password"
                        type="password"
                        required
                        minLength={8}
                        maxLength={128}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={deleting}
                      />
                    </div>

                    {deleteError && (
                      <p className="account-page__error" role="alert">
                        {deleteError}
                      </p>
                    )}

                    <div className="account-block__foot">
                      <Button
                        type="submit"
                        variant="danger"
                        disabled={deleting || saving}
                        loading={deleting}
                      >
                        {deleting ? t("Deleting…") : t("Delete account")}
                      </Button>
                    </div>
                  </form>
                </section>
              </>
            )}

            {activeTab === "privacy" && (
              <section className="account-block" aria-labelledby="account-privacy-title">
                <div className="account-block__head">
                  <h2 id="account-privacy-title">{t("Privacy preferences")}</h2>
                  <p>
                    {t("Your game activity and achievements are private by default.")}
                  </p>
                </div>

                {privacyLoading ? (
                  <SkeletonRows />
                ) : privacyError ? (
                  <ErrorState
                    message={privacyError}
                    onRetry={() => setPrivacyRevision((value) => value + 1)}
                  />
                ) : (
                  <form
                    className="account-panel"
                    aria-busy={privacySaving}
                    onSubmit={(event) => {
                      event.preventDefault();
                      savePrivacy();
                    }}
                  >
                    <div className="account-row account-row--inline">
                      <div>
                        <label htmlFor="privacy-activity">
                          <strong>{t("Share recently played games")}</strong>
                        </label>
                        <p>
                          {t("Allow other people to see which games you have played.")}
                        </p>
                      </div>

                      <input
                        id="privacy-activity"
                        type="checkbox"
                        checked={privacy.shareGameActivity}
                        disabled={privacySaving}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setPrivacy((current) => ({
                            ...current,
                            shareGameActivity: checked,
                            sharePlaytime: checked ? current.sharePlaytime : false,
                          }));
                        }}
                      />
                    </div>

                    <div className="account-row account-row--inline">
                      <div>
                        <label htmlFor="privacy-playtime">
                          <strong>{t("Show playtime and session count")}</strong>
                        </label>
                        <p>
                          {t(
                            "Show how long you have played and how many sessions you have completed.",
                          )}
                        </p>
                      </div>

                      <input
                        id="privacy-playtime"
                        type="checkbox"
                        checked={privacy.sharePlaytime}
                        disabled={privacySaving || !privacy.shareGameActivity}
                        onChange={(event) =>
                          setPrivacy((current) => ({
                            ...current,
                            sharePlaytime: event.target.checked,
                          }))
                        }
                      />
                    </div>

                    <div className="account-row account-row--inline">
                      <div>
                        <label htmlFor="privacy-achievements">
                          <strong>{t("Share achievements")}</strong>
                        </label>
                        <p>
                          {t("Allow other people to see your unlocked achievements.")}
                        </p>
                      </div>

                      <input
                        id="privacy-achievements"
                        type="checkbox"
                        checked={privacy.shareAchievements}
                        disabled={privacySaving}
                        onChange={(event) =>
                          setPrivacy((current) => ({
                            ...current,
                            shareAchievements: event.target.checked,
                          }))
                        }
                      />
                    </div>

                    {privacyMessage && (
                      <p className="account-page__success" role="status">
                        {privacyMessage}
                      </p>
                    )}

                    <div className="account-block__foot">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={privacySaving || privacyLoading}
                        loading={privacySaving}
                      >
                        {privacySaving ? t("Saving...") : t("Save privacy preferences")}
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {activeTab === "security" && (
              <>
                <section className="account-block" aria-labelledby="account-2fa-title">
                  <div className="account-block__head">
                    <h2 id="account-2fa-title">{t("Two-Factor Authentication")}</h2>
                    <p>{t("Add an extra layer of security to your account.")}</p>
                  </div>

                  <div className="account-panel">
                    {settingsError && (
                      <p className="account-page__error" role="alert">
                        {settingsError}
                      </p>
                    )}

                    {twoFactorStatus.loading ? (
                      <SkeletonRows count={1} />
                    ) : twoFactorStatus.error ? (
                      <ErrorState
                        message={twoFactorStatus.error}
                        onRetry={() => setTwoFactorRevision((value) => value + 1)}
                      />
                    ) : twoFactor.enabled ? (
                      <form onSubmit={disableTwoFactor} aria-busy={twoFactorLoading}>
                        <div className="account-row">
                          <strong className="account-page__success">
                            <CheckCircle weight="bold" size={18} /> {t("2FA is enabled")}
                          </strong>
                          <p>
                            {t("Your account is protected with an authenticator app.")}
                          </p>
                        </div>

                        <div className="account-row">
                          <label htmlFor="totp-disable">
                            {t("Enter current TOTP code to disable")}
                          </label>
                          <input
                            id="totp-disable"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9]{6}"
                            minLength={6}
                            maxLength={6}
                            value={totpToken}
                            onChange={(event) =>
                              setTotpToken(
                                event.target.value.replace(/\D/g, "").slice(0, 6),
                              )
                            }
                            placeholder={t("6-digit code")}
                            required
                            disabled={twoFactorLoading}
                          />
                        </div>

                        <div className="account-block__foot">
                          <Button
                            type="submit"
                            variant="danger"
                            disabled={twoFactorLoading}
                            loading={twoFactorLoading}
                          >
                            {twoFactorLoading ? t("Disabling…") : t("Disable 2FA")}
                          </Button>
                        </div>
                      </form>
                    ) : twoFactor.qrCode ? (
                      <form onSubmit={enableTwoFactor} aria-busy={twoFactorLoading}>
                        <div className="account-row">
                          <p>
                            {t(
                              "Scan the QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, etc.).",
                            )}
                          </p>

                          <img
                            src={safeImageUrl(twoFactor.qrCode)}
                            alt={t("QR Code for 2FA")}
                            width="200"
                            height="200"
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              margin: "10px 0",
                            }}
                          />

                          <p style={{ overflowWrap: "anywhere" }}>
                            <small>
                              {t("Secret (backup): ")}
                              <strong>{twoFactor.secret}</strong>
                            </small>
                          </p>
                        </div>

                        <div className="account-row">
                          <label htmlFor="totp-enable">
                            {t("Enter the 6-digit code from the app")}
                          </label>
                          <input
                            id="totp-enable"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9]{6}"
                            minLength={6}
                            maxLength={6}
                            value={totpToken}
                            onChange={(event) =>
                              setTotpToken(
                                event.target.value.replace(/\D/g, "").slice(0, 6),
                              )
                            }
                            placeholder="123456"
                            required
                            disabled={twoFactorLoading}
                          />
                        </div>

                        <div
                          className="account-block__foot connection-row__actions"
                          style={{ flexWrap: "wrap" }}
                        >
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={twoFactorLoading}
                            loading={twoFactorLoading}
                          >
                            {twoFactorLoading ? t("Enabling…") : t("Enable 2FA")}
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            disabled={twoFactorLoading}
                            onClick={() => {
                              setTwoFactor({
                                qrCode: null,
                                secret: null,
                                enabled: false,
                              });
                              setTotpToken("");
                              setSettingsError("");
                            }}
                          >
                            {t("Cancel")}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="account-row account-row--inline">
                        <div>
                          <strong>{t("Protect your account")}</strong>
                          <p>
                            {t(
                              "Set up two‑factor authentication using an authenticator app.",
                            )}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          onClick={setupTwoFactor}
                          disabled={twoFactorLoading}
                          loading={twoFactorLoading}
                        >
                          {twoFactorLoading ? t("Loading…") : t("Set up 2FA")}
                        </Button>
                      </div>
                    )}
                  </div>
                </section>

                <section
                  className="account-block"
                  aria-labelledby="account-devices-title"
                >
                  <div className="account-block__head">
                    <h2 id="account-devices-title">{t("Connected devices")}</h2>
                    <p>
                      {t(
                        "Review the sessions currently signed in to your Deadsmile Games account. You can disconnect another device without signing out here.",
                      )}
                    </p>
                  </div>

                  <div className="account-row account-row--inline">
                    <div>
                      <strong>{t("Active sessions")}</strong>
                      <p>
                        {t(
                          "A session may remain active even if its browser or Launcher is closed.",
                        )}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={refreshSessions}
                      disabled={sessionsLoading || Boolean(revokingSessionId)}
                      loading={sessionsLoading}
                    >
                      {!sessionsLoading && <ArrowClockwise size={18} weight="bold" />}
                      {sessionsLoading ? t("Refreshing…") : t("Refresh")}
                    </Button>
                  </div>

                  {sessionsError && (
                    <ErrorState message={sessionsError} onRetry={refreshSessions} />
                  )}

                  {sessionsMessage && (
                    <p className="account-page__success" role="status">
                      {sessionsMessage}
                    </p>
                  )}

                  {sessionsLoading && !sessionsLoaded ? (
                    <SkeletonRows count={2} />
                  ) : sessionsLoaded && sessions.length === 0 ? (
                    <div className="account-row">
                      <p>{t("No active sessions found.")}</p>
                    </div>
                  ) : (
                    sessions.map((session) => {
                      const isLauncher = session.client === "launcher";
                      const isMobile = /android|ios|iphone|ipad/i.test(
                        session.platform || "",
                      );
                      const DeviceIcon = isLauncher
                        ? GameController
                        : isMobile
                          ? DeviceMobile
                          : Desktop;

                      const signedIn = session.createdAt
                        ? new Date(session.createdAt)
                        : null;

                      return (
                        <div
                          key={session.id}
                          className="account-row account-row--inline connection-row"
                        >
                          <div
                            className="connection-row__identity"
                            style={{ flex: "1 1 240px", minWidth: 0 }}
                          >
                            <span className="connection-row__icon">
                              <DeviceIcon size={22} weight="bold" />
                            </span>

                            <div style={{ minWidth: 0 }}>
                              <strong style={{ overflowWrap: "anywhere" }}>
                                {isLauncher
                                  ? "Deadsmile Games Launcher"
                                  : t("Web browser")}{" "}
                                · {session.platform || t("Unknown device")}
                              </strong>

                              <p>
                                {session.isCurrent
                                  ? t("This device · Current session")
                                  : t("Active session")}
                              </p>

                              {signedIn && !Number.isNaN(signedIn.getTime()) && (
                                <p>
                                  {t("Signed in:")}{" "}
                                  {signedIn.toLocaleString(language, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="connection-row__actions">
                            {session.isCurrent ? (
                              <span className="connection-message">
                                {t("Current session")}
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="danger"
                                disabled={Boolean(revokingSessionId) || sessionsLoading}
                                loading={revokingSessionId === session.id}
                                onClick={() => revokeDeviceSession(session)}
                              >
                                {revokingSessionId === session.id
                                  ? t("Disconnecting…")
                                  : t("Disconnect")}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </section>
              </>
            )}

            {activeTab === "games" && (
              <>
                <section
                  className="account-block"
                  aria-labelledby="account-connections-title"
                >
                  <div className="account-block__head">
                    <h2 id="account-connections-title">{t("Connected accounts")}</h2>
                    <p>
                      {t(
                        "Link itch.io to verify purchases and keep your Deadsmile Games library available on the site and launcher.",
                      )}
                    </p>
                  </div>

                  {itch.loading ? (
                    <SkeletonRows count={1} />
                  ) : (
                    <div className="account-row account-row--inline connection-row">
                      <div
                        className="connection-row__identity"
                        style={{ flex: "1 1 200px", minWidth: 0 }}
                      >
                        <span className="connection-row__icon">
                          <GameController weight="bold" />
                        </span>

                        <div style={{ minWidth: 0 }}>
                          <strong>itch.io</strong>
                          <p style={{ overflowWrap: "anywhere" }}>
                            {itch.connected
                              ? t("Connected as {0}", { 0: itch.username })
                              : t("Not connected")}
                          </p>
                        </div>
                      </div>

                      <div
                        className="connection-row__actions"
                        style={{ flexWrap: "wrap" }}
                      >
                        {itch.connected ? (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={syncItch}
                              disabled={itchBusy}
                            >
                              {t("Refresh library")}
                            </Button>

                            <Button
                              type="button"
                              variant="danger"
                              onClick={disconnectItch}
                              disabled={itchBusy}
                            >
                              {t("Disconnect")}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            onClick={connectItch}
                            disabled={itchBusy || itch.unavailable}
                          >
                            {t("Connect itch.io")}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {itchMessage && (
                    <p className="connection-message" role="status">
                      {itchMessage}
                    </p>
                  )}
                </section>

                <section className="account-block" aria-labelledby="account-saves-title">
                  <div className="account-block__head">
                    <h2 id="account-saves-title">{t("Cloud saves")}</h2>
                    <p>
                      {t(
                        "Back up, restore and manage saves for supported games in your library.",
                      )}
                    </p>
                  </div>
                  <CloudSaves />
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      {avatarDraft && (
        <div
          className="account-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-crop-title"
        >
          <div
            className="modal-card crop-modal"
            ref={modalRef}
            tabIndex={-1}
            aria-labelledby="account-crop-title"
          >
            <div className="modal-card__head">
              <h3 id="account-crop-title">{t("Adjust photo")}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={cancelCrop}
                aria-label={t("Close")}
              >
                <X weight="bold" />
              </button>
            </div>

            <div
              className="crop-viewport"
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              onPointerLeave={onDragEnd}
            >
              <img
                src={avatarDraft.src}
                alt=""
                draggable={false}
                style={{
                  width: avatarDraft.width * coverScaleFor(avatarDraft) * zoom,
                  height: avatarDraft.height * coverScaleFor(avatarDraft) * zoom,
                  marginLeft:
                    -(avatarDraft.width * coverScaleFor(avatarDraft) * zoom) / 2,
                  marginTop:
                    -(avatarDraft.height * coverScaleFor(avatarDraft) * zoom) / 2,
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg)`,
                }}
              />
            </div>

            <div className="crop-controls">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setRotation((current) => current - 90)}
                aria-label={t("Rotate left")}
              >
                <ArrowCounterClockwise weight="bold" />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(parseFloat(event.target.value))}
                aria-label={t("Zoom")}
              />

              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setRotation((current) => current + 90)}
                aria-label={t("Rotate right")}
              >
                <ArrowClockwise weight="bold" />
              </button>
            </div>

            <div className="modal-card__foot">
              <Button type="button" variant="secondary" onClick={cancelCrop}>
                {t("Cancel")}
              </Button>
              <Button type="button" variant="primary" onClick={applyCrop}>
                {t("Apply")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {saveModal.open && (
        <div
          className="account-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-save-title"
          aria-busy={saveModal.status === "saving"}
        >
          <div
            className={`modal-card save-modal save-modal--${saveModal.status}`}
            ref={modalRef}
            tabIndex={-1}
            aria-labelledby="account-save-title"
          >
            {saveModal.status !== "saving" && (
              <button
                type="button"
                className="modal-close"
                onClick={closeSaveModal}
                aria-label={t("Close")}
              >
                <X weight="bold" />
              </button>
            )}

            <div className="save-modal__icon">
              {saveModal.status === "success" && <CheckCircle weight="bold" />}
              {saveModal.status === "error" && <WarningCircle weight="bold" />}
            </div>

            <h3 id="account-save-title">{t(saveModal.title)}</h3>

            {saveModal.status === "saving" && (
              <div className="save-progress">
                <div className="save-progress__bar" />
              </div>
            )}

            {saveModal.message && (
              <p className="save-modal__message">{t(saveModal.message)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
