import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import { Button } from "../components/ui/Button";
import { Reveal } from "../components/ui/Reveal";
import {
    ArrowLeft,
    User,
    GearSix,
    GameController,
    ShieldCheck,
    CloudArrowUp,
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
    Devices,
    Desktop,
    DeviceMobile,
} from "@phosphor-icons/react";
import { CloudSaves } from "../components/account/CloudSaves";
import { safeImageUrl, safeOAuthItchUrl } from "../utils/urls";
import { FOCUSABLE_SELECTOR, lockBodyScroll } from "../utils/dom";
import "../styles/account-cards.css";

const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: GearSix },
    { id: "privacy", label: "Privacy", icon: Eye },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "games", label: "Games & saves", icon: GameController },
];

function AccountCard({ icon: Icon, title, description, children, danger = false }) {
    return (
        <section className={"account-settings-card support-card" + (danger ? " account-settings-card--danger" : "")}>
            <header className="account-settings-card__head">
                {Icon && <span className="account-settings-card__icon" aria-hidden="true"><Icon size={23} weight="bold" /></span>}
                <div>
                    <h2>{title}</h2>
                    {description && <p>{description}</p>}
                </div>
            </header>
            <div className="account-settings-card__body">{children}</div>
        </section>
    );
}

const CROP_VIEWPORT = 260;
const OUTPUT_SIZE = 420;

export function Account() {
    const { user, logout, refresh } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const [sessionsError, setSessionsError] = useState("");
    const [sessionsMessage, setSessionsMessage] = useState("");
    const [revokingSessionId, setRevokingSessionId] = useState(null);

    const [form, setForm] = useState({
        username: user?.username || "",
        email: user?.email || "",
        bio: user?.bio || "",
        websiteUrl: user?.websiteUrl || "",
        location: user?.location || "",
        avatarUrl: user?.avatarUrl || null,
    });
    const [password, setPassword] = useState("");
    const [emailPassword, setEmailPassword] =
        useState("");

    const [emailMessage, setEmailMessage] =
        useState("");
    const [privacy, setPrivacy] = useState({
        shareGameActivity: false,
        sharePlaytime: false,
        shareAchievements: false
    });

    const [privacyLoading, setPrivacyLoading] =
        useState(true);
    const [privacyLoaded, setPrivacyLoaded] = useState(false);

    const [privacySaving, setPrivacySaving] =
        useState(false);

    const [privacyMessage, setPrivacyMessage] =
        useState("");

    const [privacyError, setPrivacyError] =
        useState("");
    const [profileError, setProfileError] = useState("");
    const [settingsError, setSettingsError] = useState("");
    const [securityError, setSecurityError] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
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


    const [twoFactor, setTwoFactor] = useState({ qrCode: null, secret: null, enabled: false });
    const [totpToken, setTotpToken] = useState('');
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [itch, setItch] = useState({ loading: true, connected: false });
    const [itchBusy, setItchBusy] = useState(false);
    const [itchMessage, setItchMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadPrivacy() {
            setPrivacyLoading(true);
            setPrivacyError("");

            try {
                const result = await api.get(
                    "/account/privacy"
                );

                if (cancelled) {
                    return;
                }

                setPrivacyLoaded(true);
                setPrivacy({
                    shareGameActivity:
                        Boolean(result.shareGameActivity),

                    sharePlaytime:
                        Boolean(result.sharePlaytime),

                    shareAchievements:
                        Boolean(result.shareAchievements)
                });
            } catch (err) {
                if (!cancelled) {
                    setPrivacyLoaded(false);
                    setPrivacyError(
                        err?.message ||
                        "Unable to load your privacy preferences."
                    );
                }
            } finally {
                if (!cancelled) {
                    setPrivacyLoading(false);
                }
            }
        }

        loadPrivacy();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadTwoFactorStatus() {
            try {
                const data = await api.get('/account/totp/status');
                if (!cancelled) {
                    setTwoFactor((current) => ({
                        ...current,
                        enabled: Boolean(data?.enabled),
                        qrCode: data?.enabled ? null : current.qrCode,
                        secret: data?.enabled ? null : current.secret,
                    }));
                }
            } catch { }
        }

        loadTwoFactorStatus();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const modalOpen = Boolean(avatarDraft) || saveModal.open;
        if (!modalOpen) return undefined;
        const previousFocus = document.activeElement;
        const unlock = lockBodyScroll();
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (avatarDraft) cancelCrop();
                else if (saveModal.status !== 'saving') closeSaveModal();
                return;
            }
            if (event.key !== 'Tab' || !modalRef.current) return;
            const focusable = [...modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
                (element) => element instanceof HTMLElement && !element.hasAttribute('disabled'),
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
        document.addEventListener('keydown', onKeyDown);
        modalRef.current?.focus();
        return () => {
            unlock();
            document.removeEventListener('keydown', onKeyDown);
            if (previousFocus instanceof HTMLElement) previousFocus.focus();
        };
    }, [avatarDraft, saveModal.open, saveModal.status]);

    useEffect(() => {
        let cancelled = false;
        api.get('/integrations/itch')
            .then((data) => {
                if (!cancelled) setItch({ ...data, loading: false });
            })
            .catch(() => {
                if (!cancelled) setItch({ loading: false, connected: false, unavailable: true });
            });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (activeTab !== "security" || !user?.id) {
            return;
        }

        let cancelled = false;

        async function loadOnTabOpen() {
            setSessionsLoading(true);
            setSessionsLoaded(false);
            setSessionsError("");
            setSessionsMessage("");

            try {
                const result = await api.get("/account/sessions");

                if (cancelled) return;

                setSessions(
                    Array.isArray(result?.sessions)
                        ? result.sessions
                        : []
                );

                setSessionsLoaded(true);
            } catch {
                if (cancelled) return;

                setSessions([]);
                setSessionsError(
                    "We could not load your connected devices."
                );
            } finally {
                if (!cancelled) {
                    setSessionsLoading(false);
                }
            }
        }

        loadOnTabOpen();

        return () => {
            cancelled = true;
        };
    }, [activeTab, user?.id]);

    if (!user) return null;

    async function refreshSessions() {
        if (sessionsLoading || revokingSessionId) return;

        setSessionsLoading(true);
        setSessionsError("");
        setSessionsMessage("");

        try {
            const result = await api.get("/account/sessions");

            setSessions(
                Array.isArray(result?.sessions)
                    ? result.sessions
                    : []
            );

            setSessionsLoaded(true);
        } catch {
            setSessionsError(
                "We could not refresh your connected devices."
            );
        } finally {
            setSessionsLoading(false);
        }
    }

    async function revokeDeviceSession(session) {
        if (
            !session?.id ||
            session.isCurrent ||
            revokingSessionId
        ) {
            return;
        }

        const confirmed = window.confirm(
            "Disconnect this device? It will need to sign in again."
        );

        if (!confirmed) return;

        setRevokingSessionId(session.id);
        setSessionsError("");
        setSessionsMessage("");

        try {
            await api.delete(
                `/account/sessions/${encodeURIComponent(session.id)}`
            );

            // Remove imediatamente a sessão encerrada da lista.
            setSessions((current) =>
                current.filter((item) => item.id !== session.id)
            );

            setSessionsMessage(
                "The selected device has been disconnected."
            );
        } catch (error) {
            if (error?.code === "SESSION_NOT_FOUND") {
                setSessionsError(
                    "This session is no longer active. Refresh the list."
                );
            } else {
                setSessionsError(
                    "We could not disconnect this device. Please try again."
                );
            }
        } finally {
            setRevokingSessionId(null);
        }
    }

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    async function setupTwoFactor() {
        setSecurityError("");
        setTwoFactorLoading(true);
        try {
            const data = await api.post('/account/totp/setup');
            setTwoFactor({ qrCode: data.qrCodeDataUrl, secret: data.secret, enabled: false });
        } catch {
            setSecurityError('We could not prepare two-factor authentication right now.');
        } finally {
            setTwoFactorLoading(false);
        }
    }

    async function enableTwoFactor(e) {
        e.preventDefault();
        setSecurityError("");
        setTwoFactorLoading(true);
        try {
            await api.post('/account/totp/enable', { token: totpToken });
            setTwoFactor(prev => ({ ...prev, enabled: true }));
            setTotpToken('');
        } catch {
            setSecurityError('We could not enable two-factor authentication. Check the code and try again.');
        } finally {
            setTwoFactorLoading(false);
        }
    }

    async function disableTwoFactor(e) {
        e.preventDefault();
        if (!window.confirm('Disable 2FA? You will lose the extra security.')) return;
        setSecurityError("");
        setTwoFactorLoading(true);
        try {
            await api.delete('/account/totp/disable', { token: totpToken });
            setTwoFactor({ qrCode: null, secret: null, enabled: false });
            setTotpToken('');
        } catch {
            setSecurityError('We could not disable two-factor authentication. Check the code and try again.');
        } finally {
            setTwoFactorLoading(false);
        }
    }

    async function withSaveModal(title, setFlag, fn) {
        setFlag(true);
        setSaveModal({ open: true, status: "saving", title, message: "" });
        try {
            await fn();
            setSaveModal({
                open: true,
                status: "success",
                title,
                message: "Changes saved.",
            });
            setTimeout(
                () => setSaveModal((m) => ({ ...m, open: false })),
                1300,
            );
        } catch (err) {
            setSaveModal({
                open: true,
                status: "error",
                title,
                message: err.message || "Something went wrong.",
            });
        } finally {
            setFlag(false);
        }
    }

    function closeSaveModal() {
        setSaveModal((m) => ({ ...m, open: false }));
    }

    async function onAvatarSelect(e) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (
            !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
            file.size > 5_000_000
        ) {
            setProfileError("Use PNG, JPG or WEBP up to 5 MB.");
            return;
        }
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = dataUrl;
            });
            setRotation(0);
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setAvatarDraft({
                src: dataUrl,
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
            setProfileError("");
        } catch {
            setProfileError("Failed to process image.");
        }
    }

    function coverScaleFor(draft) {
        return Math.max(
            CROP_VIEWPORT / draft.width,
            CROP_VIEWPORT / draft.height,
        );
    }

    function onDragStart(e) {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragState.current = {
            startX: e.clientX - pan.x,
            startY: e.clientY - pan.y,
        };
    }

    function onDragMove(e) {
        if (!dragState.current) return;
        setPan({
            x: e.clientX - dragState.current.startX,
            y: e.clientY - dragState.current.startY,
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
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = OUTPUT_SIZE;
            canvas.height = OUTPUT_SIZE;
            const ctx = canvas.getContext("2d");
            const k = OUTPUT_SIZE / CROP_VIEWPORT;
            const displayScale = coverScaleFor(avatarDraft) * zoom;
            ctx.save();
            ctx.translate(
                OUTPUT_SIZE / 2 + pan.x * k,
                OUTPUT_SIZE / 2 + pan.y * k,
            );
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(displayScale * k, displayScale * k);
            ctx.drawImage(
                img,
                -avatarDraft.width / 2,
                -avatarDraft.height / 2,
            );
            ctx.restore();
            const qualities = [0.88, 0.76, 0.64, 0.52];
            const finalUrl = qualities
                .map((quality) => canvas.toDataURL("image/jpeg", quality))
                .find((value) => value.length <= 500_000);
            if (!finalUrl) {
                setProfileError("The cropped image is still too large. Choose a smaller source image.");
                return;
            }
            setForm((f) => ({ ...f, avatarUrl: finalUrl }));
            setAvatarDraft(null);
        };
        img.src = avatarDraft.src;
    }

    async function saveProfile(e) {
        e.preventDefault();
        setProfileError("");
        await withSaveModal("Saving profile", setSaving, async () => {
            await api.patch("/account", {
                username: form.username,
                bio: form.bio,
                websiteUrl: form.websiteUrl,
                location: form.location,
                avatarUrl: form.avatarUrl
            });
            await refresh();
        });
    }

    async function saveSettings(e) {
        e.preventDefault();

        setSettingsError("");
        setEmailMessage("");

        const newEmail = form.email
            .trim()
            .toLowerCase();

        const currentEmail = user.email
            .trim()
            .toLowerCase();

        if (newEmail === currentEmail) {
            setSettingsError(
                "Enter a new email address."
            );

            return;
        }

        if (!emailPassword) {
            setSettingsError(
                "Enter your current account password."
            );

            return;
        }

        setSaving(true);

        try {
            await api.post(
                "/account/email/change",
                {
                    email: newEmail,
                    password: emailPassword
                }
            );

            setEmailPassword("");

            setEmailMessage(
                "A confirmation link has been sent to " +
                newEmail +
                ". Your current email address will remain " +
                "active until you confirm the new one."
            );
        } catch (err) {
            setSettingsError(
                err?.message ||
                "Unable to request the email change."
            );
        } finally {
            setSaving(false);
        }
    }

    async function savePrivacy() {
        if (privacySaving || privacyLoading || !privacyLoaded) {
            return;
        }

        setPrivacySaving(true);
        setPrivacyMessage("");
        setPrivacyError("");

        try {
            const result = await api.put(
                "/account/privacy",
                {
                    shareGameActivity:
                        privacy.shareGameActivity,

                    sharePlaytime:
                        privacy.shareGameActivity &&
                        privacy.sharePlaytime,

                    shareAchievements:
                        privacy.shareAchievements
                }
            );

            setPrivacy({
                shareGameActivity:
                    Boolean(result.shareGameActivity),

                sharePlaytime:
                    Boolean(result.sharePlaytime),

                shareAchievements:
                    Boolean(result.shareAchievements)
            });

            await refresh();

            setPrivacyMessage(
                "Your privacy preferences have been saved."
            );
        } catch (err) {
            setPrivacyError(
                err?.message ||
                "Unable to save your privacy preferences."
            );
        } finally {
            setPrivacySaving(false);
        }
    }

    async function del(e) {
        e.preventDefault();
        setDeleteError("");
        await withSaveModal("Deleting account", setDeleting, async () => {
            await api.delete("/account", { password });
            await logout();
            navigate("/", { replace: true });
        });
    }

    async function signOut() {
        await logout();
        navigate("/", { replace: true });
    }

    async function connectItch() {
        setItchBusy(true);
        setItchMessage("");
        try {
            const result = await api.post('/integrations/itch/connect', {
                client: 'site',
                locale: 'en',
                returnPath: '/account',
            });
            const authorizeUrl = safeOAuthItchUrl(result.authorizeUrl);
            if (!authorizeUrl) throw new Error('Invalid OAuth redirect.');
            window.location.assign(authorizeUrl);
        } catch {
            setItchMessage('We could not start the itch.io connection. Please try again.');
            setItchBusy(false);
        }
    }

    async function syncItch() {
        setItchBusy(true);
        setItchMessage("");
        try {
            await api.post('/library/sync');
            const status = await api.get('/integrations/itch');
            setItch({ ...status, loading: false });
            setItchMessage('Your itch.io library is up to date.');
        } catch {
            setItchMessage('We could not refresh your itch.io library right now.');
        } finally {
            setItchBusy(false);
        }
    }

    async function disconnectItch() {
        if (!window.confirm('Disconnect itch.io from your Deadsmile Games account?')) return;
        setItchBusy(true);
        setItchMessage("");
        try {
            await api.delete('/integrations/itch');
            setItch({ loading: false, connected: false, configured: true });
            setItchMessage('Your itch.io account was disconnected.');
        } catch {
            setItchMessage('We could not disconnect the account right now.');
        } finally {
            setItchBusy(false);
        }
    }

    return (
        <div className="account-page container account-settings">
            <Link to="/" className="back-link">
                <ArrowLeft weight="bold" />
                <span>Back</span>
            </Link>

            <header className="account-settings__intro">
                <span className="account-settings__eyebrow">DEADSMILE GAMES</span>
                <h1>Account settings</h1>
                <p>Manage your profile, privacy, security and games in one place.</p>
            </header>

            <div className="account-page__layout account-settings__layout">
                <aside aria-label="Account settings sections" className="account-settings__sidebar">
                    <nav aria-label="Account settings" className="account-settings__nav">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={"account-nav-item" + (activeTab === tab.id ? " is-active" : "")}
                                    aria-pressed={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon size={20} weight="bold" />
                                    <span>{tab.label}</span>
                                    <CaretRight className="account-settings__nav-arrow" size={15} weight="bold" />
                                </button>
                            );
                        })}
                    </nav>
                    <div className="account-settings__related">
                        <span className="account-nav-title">Related</span>
                        <Link to="/wishlist" className="account-nav-item account-page__wishlist">
                            <Heart size={20} weight="bold" />
                            <span>Wishlist</span>
                            <CaretRight className="account-settings__nav-arrow" size={15} weight="bold" />
                        </Link>
                    </div>
                </aside>

                <main className="account-page__content account-settings__content" id="account-settings-content">
                    {activeTab === "profile" && (
                        <Reveal key="profile">
                            <div className="account-settings__stack">
                                <AccountCard
                                    icon={User}
                                    title="Profile picture"
                                    description="Choose the picture shown on your public profile."
                                >
                                    <div className="account-settings__avatar-row">
                                        <div className="account-page__avatar">
                                            <div className="account-page__avatar-inner">
                                                {safeImageUrl(form.avatarUrl) ? (
                                                    <img src={safeImageUrl(form.avatarUrl)} alt="Your profile picture" />
                                                ) : (
                                                    user.username.slice(0, 1).toUpperCase()
                                                )}
                                            </div>
                                            <label className="avatar-upload-dot" title="Change profile picture">
                                                <PencilSimple size={22} weight="bold" />
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    onChange={onAvatarSelect}
                                                    aria-label="Change profile picture"
                                                />
                                            </label>
                                        </div>
                                        <div className="account-settings__avatar-copy">
                                            <strong>{user.username}</strong>
                                            {user.createdAt && (
                                                <p>Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
                                            )}
                                            <p>PNG, JPG or WEBP · Maximum 5 MB</p>
                                        </div>
                                    </div>
                                    {profileError && <p className="account-page__error" role="alert">{profileError}</p>}
                                </AccountCard>

                                <AccountCard
                                    icon={PencilSimple}
                                    title="Profile details"
                                    description="Choose what appears on your public profile."
                                >
                                    <form className="account-settings__form" onSubmit={saveProfile}>
                                        <div className="account-settings__fields">
                                            <label className="account-settings__field" htmlFor="acc-username">
                                                <span>Username</span>
                                                <input id="acc-username" value={form.username.toLowerCase()}
                                                    onChange={set("username")} placeholder="@username"
                                                    required minLength={3} maxLength={24} pattern="[A-Za-z0-9_\-]+" />
                                            </label>
                                            <label className="account-settings__field" htmlFor="acc-bio">
                                                <span>Bio</span>
                                                <textarea id="acc-bio" value={form.bio} onChange={set("bio")}
                                                    placeholder="Write something about yourself." maxLength={500} rows={3} />
                                            </label>
                                            <div className="account-settings__field-grid">
                                                <label className="account-settings__field" htmlFor="acc-website">
                                                    <span>Website</span>
                                                    <input id="acc-website" type="url" maxLength={2000}
                                                        value={form.websiteUrl} onChange={set("websiteUrl")} placeholder="https://…" />
                                                </label>
                                                <label className="account-settings__field" htmlFor="acc-location">
                                                    <span>Location</span>
                                                    <input id="acc-location" maxLength={120} value={form.location}
                                                        onChange={set("location")} placeholder="City, Country" />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="account-settings__actions">
                                            <Button type="submit" variant="primary" disabled={saving}>
                                                {saving ? "Saving…" : "Save profile"}
                                            </Button>
                                        </div>
                                    </form>
                                </AccountCard>
                            </div>
                        </Reveal>
                    )}

                    {activeTab === "account" && (
                        <Reveal key="account">
                            <div className="account-settings__stack">
                                <AccountCard
                                    icon={GearSix}
                                    title="Email address"
                                    description="Confirm a new address before your account email is changed."
                                >
                                    <form className="account-settings__form" onSubmit={saveSettings}>
                                        <div className="account-settings__fields">
                                            <p className="account-settings__hint">Current email: <strong>{user.email}</strong></p>
                                            <label className="account-settings__field" htmlFor="acc-email">
                                                <span>New email address</span>
                                                <input id="acc-email" type="email" required maxLength={254}
                                                    autoComplete="email" value={form.email} onChange={set("email")} />
                                            </label>
                                            <label className="account-settings__field" htmlFor="acc-email-password">
                                                <span>Current account password</span>
                                                <input id="acc-email-password" type="password" required minLength={1}
                                                    maxLength={128} autoComplete="current-password" value={emailPassword}
                                                    onChange={(event) => setEmailPassword(event.target.value)} />
                                            </label>
                                            {emailMessage && <p className="account-settings__success" role="status">{emailMessage}</p>}
                                            {settingsError && <p className="account-page__error" role="alert">{settingsError}</p>}
                                        </div>
                                        <div className="account-settings__actions">
                                            <Button type="submit" variant="primary" disabled={saving}>
                                                {saving ? "Sending confirmation…" : "Request email change"}
                                            </Button>
                                        </div>
                                    </form>
                                </AccountCard>

                                <AccountCard
                                    icon={LockKey}
                                    title="Password & recovery"
                                    description="Forgot your password or want to reset it? Use the secure recovery page."
                                >
                                    <div className="account-settings__actions account-settings__actions--standalone">
                                        <Button type="button" variant="secondary" onClick={() => navigate("/forgot-password")}>
                                            Reset your password <CaretRight size={17} weight="bold" />
                                        </Button>
                                    </div>
                                </AccountCard>

                                <AccountCard
                                    icon={ArrowLeft}
                                    title="Sign out"
                                    description="End your session on this browser without disconnecting your other devices."
                                >
                                    <div className="account-settings__actions account-settings__actions--standalone">
                                        <Button type="button" variant="secondary" onClick={signOut}>Log out</Button>
                                    </div>
                                </AccountCard>

                                <AccountCard
                                    icon={WarningCircle}
                                    title="Delete account"
                                    description="This action is permanent and removes access to your profile."
                                    danger
                                >
                                    <form className="account-settings__form" onSubmit={del}>
                                        <div className="account-settings__fields">
                                            <label className="account-settings__field" htmlFor="acc-password">
                                                <span>Current password</span>
                                                <input id="acc-password" type="password" required minLength={1} maxLength={128}
                                                    autoComplete="current-password" value={password}
                                                    onChange={(event) => setPassword(event.target.value)} />
                                            </label>
                                            {deleteError && <p className="account-page__error" role="alert">{deleteError}</p>}
                                        </div>
                                        <div className="account-settings__actions">
                                            <Button type="submit" variant="danger" disabled={deleting}>
                                                {deleting ? "Deleting…" : "Delete account"}
                                            </Button>
                                        </div>
                                    </form>
                                </AccountCard>
                            </div>
                        </Reveal>
                    )}

                    {activeTab === "privacy" && (
                        <Reveal key="privacy">
                            <div className="account-settings__stack">
                                {privacyLoading ? (
                                    <div className="account-settings-card support-card" role="status">Loading privacy preferences…</div>
                                ) : (
                                    <>
                                        <AccountCard icon={GameController} title="Game activity"
                                            description="Decide whether other people can see which games you have played.">
                                            <label className="account-settings__toggle">
                                                <span>
                                                    <strong>Share recently played games</strong>
                                                    <small>When disabled, your game activity remains private.</small>
                                                </span>
                                                <input type="checkbox" checked={privacy.shareGameActivity}
                                                    disabled={!privacyLoaded || privacySaving}
                                                    onChange={(event) => {
                                                        const checked = event.target.checked;
                                                        setPrivacy((current) => ({
                                                            ...current,
                                                            shareGameActivity: checked,
                                                            sharePlaytime: checked ? current.sharePlaytime : false,
                                                        }));
                                                    }} />
                                            </label>
                                        </AccountCard>
                                        <AccountCard icon={ArrowClockwise} title="Playtime & sessions"
                                            description="Control whether your playtime and session count are visible.">
                                            <label className="account-settings__toggle">
                                                <span>
                                                    <strong>Show playtime and session count</strong>
                                                    <small>You must share game activity to enable this option.</small>
                                                </span>
                                                <input type="checkbox" checked={privacy.sharePlaytime}
                                                    disabled={!privacyLoaded || privacySaving || !privacy.shareGameActivity}
                                                    onChange={(event) => setPrivacy((current) => ({
                                                        ...current, sharePlaytime: event.target.checked,
                                                    }))} />
                                            </label>
                                        </AccountCard>
                                        <AccountCard icon={CheckCircle} title="Achievements"
                                            description="Choose whether others can see your unlocked achievements.">
                                            <label className="account-settings__toggle">
                                                <span>
                                                    <strong>Share achievements</strong>
                                                    <small>Turn this off to keep your unlocked achievements private.</small>
                                                </span>
                                                <input type="checkbox" checked={privacy.shareAchievements}
                                                    disabled={!privacyLoaded || privacySaving}
                                                    onChange={(event) => setPrivacy((current) => ({
                                                        ...current, shareAchievements: event.target.checked,
                                                    }))} />
                                            </label>
                                        </AccountCard>
                                        <div className="account-settings__privacy-footer">
                                            {privacyError && <p className="account-page__error" role="alert">{privacyError}</p>}
                                            {privacyMessage && <p className="account-settings__success" role="status">{privacyMessage}</p>}
                                            <Button type="button" variant="primary" onClick={savePrivacy}
                                                disabled={privacySaving || privacyLoading || !privacyLoaded}>
                                                {privacySaving ? "Saving…" : "Save privacy preferences"}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Reveal>
                    )}

                    {activeTab === "security" && (
                        <Reveal key="security">
                            <div className="account-settings__stack">
                                <AccountCard icon={ShieldCheck} title="Two-factor authentication"
                                    description="Add an extra layer of protection using an authenticator app.">
                                    {twoFactor.enabled ? (
                                        <form className="account-settings__form" onSubmit={disableTwoFactor}>
                                            <div className="account-settings__fields">
                                                <p className="account-settings__success"><CheckCircle size={17} weight="bold" /> 2FA is enabled</p>
                                                <p className="account-settings__hint">Your account is protected with an authenticator app.</p>
                                                <label className="account-settings__field" htmlFor="totp-disable">
                                                    <span>Enter the current six-digit code to disable 2FA</span>
                                                    <input id="totp-disable" type="text" inputMode="numeric" pattern="[0-9]{6}"
                                                        maxLength={6} value={totpToken} autoComplete="one-time-code"
                                                        onChange={(event) => setTotpToken(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                                        placeholder="6-digit code" required />
                                                </label>
                                            </div>
                                            <div className="account-settings__actions">
                                                <Button type="submit" variant="danger" disabled={twoFactorLoading}>
                                                    {twoFactorLoading ? "Disabling…" : "Disable 2FA"}
                                                </Button>
                                            </div>
                                        </form>
                                    ) : twoFactor.qrCode ? (
                                        <form className="account-settings__form" onSubmit={enableTwoFactor}>
                                            <div className="account-settings__fields">
                                                <p>Scan this QR code with your authenticator app.</p>
                                                <img className="account-settings__qr" src={safeImageUrl(twoFactor.qrCode)} alt="QR code to set up two-factor authentication" />
                                                <p className="account-settings__hint">Secret (backup): <strong className="account-settings__secret">{twoFactor.secret}</strong></p>
                                                <label className="account-settings__field" htmlFor="totp-enable">
                                                    <span>Enter the six-digit code from your app</span>
                                                    <input id="totp-enable" type="text" inputMode="numeric" pattern="[0-9]{6}"
                                                        maxLength={6} value={totpToken} autoComplete="one-time-code"
                                                        onChange={(event) => setTotpToken(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                                        placeholder="123456" required />
                                                </label>
                                            </div>
                                            <div className="account-settings__actions">
                                                <Button type="submit" variant="primary" disabled={twoFactorLoading}>
                                                    {twoFactorLoading ? "Enabling…" : "Enable 2FA"}
                                                </Button>
                                                <Button type="button" variant="ghost"
                                                    onClick={() => { setTwoFactor({ qrCode: null, secret: null, enabled: false }); setTotpToken(""); }}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="account-settings__actions account-settings__actions--split">
                                            <p className="account-settings__hint">Use an authenticator app to protect your account.</p>
                                            <Button type="button" variant="primary" onClick={setupTwoFactor} disabled={twoFactorLoading}>
                                                {twoFactorLoading ? "Loading…" : "Set up 2FA"}
                                            </Button>
                                        </div>
                                    )}
                                    {securityError && <p className="account-page__error" role="alert">{securityError}</p>}
                                </AccountCard>

                                <AccountCard icon={Devices} title="Connected devices"
                                    description="Only valid sign-ins are listed. A session can remain active even when its browser is closed.">
                                    <div className="account-settings__actions account-settings__actions--standalone">
                                        <Button type="button" variant="secondary" onClick={refreshSessions}
                                            disabled={sessionsLoading || Boolean(revokingSessionId)}>
                                            <ArrowClockwise size={17} weight="bold" />
                                            {sessionsLoading ? "Refreshing…" : "Refresh sessions"}
                                        </Button>
                                    </div>
                                    {sessionsError && <p className="account-page__error" role="alert">{sessionsError}</p>}
                                    {sessionsMessage && <p className="account-settings__success" role="status">{sessionsMessage}</p>}
                                    {sessionsLoading && !sessionsLoaded ? (
                                        <p className="account-settings__hint" role="status">Loading connected devices…</p>
                                    ) : sessionsLoaded && sessions.length === 0 ? (
                                        <p className="account-settings__hint">No active sessions found.</p>
                                    ) : sessionsLoaded && (
                                        <div className="account-settings__devices">
                                            {sessions.map((session) => {
                                                const isLauncher = session.client === "launcher";
                                                const isMobile = /android|ios|iphone|ipad/i.test(session.platform || "");
                                                const DeviceIcon = isLauncher ? GameController : isMobile ? DeviceMobile : Desktop;
                                                const clientName = isLauncher ? "Deadsmile Games Launcher" : "Web browser";
                                                const createdDate = session.createdAt ? new Date(session.createdAt) : null;
                                                const validCreatedDate = createdDate && !Number.isNaN(createdDate.getTime());
                                                return (
                                                    <article className="account-settings__device" key={session.id}>
                                                        <div className="account-settings__device-main">
                                                            <span className="account-settings__device-icon" aria-hidden="true"><DeviceIcon size={23} weight="bold" /></span>
                                                            <div className="account-settings__device-info">
                                                                <strong>{clientName} · {session.platform || "Unknown device"}</strong>
                                                                <span>{session.isCurrent ? "This device · Current session" : "Active session"}</span>
                                                                {validCreatedDate && <small>Signed in: {createdDate.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</small>}
                                                            </div>
                                                        </div>
                                                        {session.isCurrent ? (
                                                            <span className="account-settings__current">Current</span>
                                                        ) : (
                                                            <Button type="button" variant="danger" disabled={Boolean(revokingSessionId) || sessionsLoading}
                                                                onClick={() => revokeDeviceSession(session)}>
                                                                {revokingSessionId === session.id ? "Disconnecting…" : "Disconnect"}
                                                            </Button>
                                                        )}
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}
                                </AccountCard>
                            </div>
                        </Reveal>
                    )}

                    {activeTab === "games" && (
                        <Reveal key="games">
                            <div className="account-settings__stack">
                                <AccountCard icon={GameController} title="Connected accounts"
                                    description="Link itch.io to verify purchases and synchronize your game library.">
                                    <div className="account-settings__connection">
                                        <span className="account-settings__device-icon" aria-hidden="true"><GameController size={23} weight="bold" /></span>
                                        <div>
                                            <strong>itch.io</strong>
                                            <p className="account-settings__hint">
                                                {itch.loading ? "Checking connection…" : itch.connected ? `Connected as ${itch.username}` : "Not connected"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="account-settings__actions">
                                        {itch.connected ? (
                                            <>
                                                <Button type="button" variant="secondary" onClick={syncItch} disabled={itchBusy}>Refresh library</Button>
                                                <Button type="button" variant="danger" onClick={disconnectItch} disabled={itchBusy}>Disconnect</Button>
                                            </>
                                        ) : (
                                            <Button type="button" variant="primary" onClick={connectItch}
                                                disabled={itchBusy || itch.loading || itch.unavailable}>Connect itch.io</Button>
                                        )}
                                    </div>
                                    {itchMessage && <p className="account-settings__hint" role="status">{itchMessage}</p>}
                                </AccountCard>

                                <AccountCard icon={CloudArrowUp} title="Cloud saves"
                                    description="Back up, restore and manage saves for supported games in your library.">
                                    <CloudSaves />
                                </AccountCard>
                            </div>
                        </Reveal>
                    )}
                </main>
            </div>

            {avatarDraft && (
                <div className="account-modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card crop-modal" ref={modalRef} tabIndex={-1} aria-labelledby="account-crop-title">
                        <div className="modal-card__head">
                            <h3 id="account-crop-title">Adjust photo</h3>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={cancelCrop}
                                aria-label="Close"
                            >
                                <X weight="bold" />
                            </button>
                        </div>
                        <div
                            className="crop-viewport"
                            onPointerDown={onDragStart}
                            onPointerMove={onDragMove}
                            onPointerUp={onDragEnd}
                            onPointerLeave={onDragEnd}
                        >
                            <img
                                src={avatarDraft.src}
                                alt=""
                                draggable={false}
                                style={{
                                    width:
                                        avatarDraft.width *
                                        coverScaleFor(avatarDraft) *
                                        zoom,
                                    height:
                                        avatarDraft.height *
                                        coverScaleFor(avatarDraft) *
                                        zoom,
                                    marginLeft:
                                        (-(
                                            avatarDraft.width *
                                            coverScaleFor(avatarDraft) *
                                            zoom
                                        ) /
                                            2),
                                    marginTop:
                                        (-(
                                            avatarDraft.height *
                                            coverScaleFor(avatarDraft) *
                                            zoom
                                        ) /
                                            2),
                                    transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg)`,
                                }}
                            />
                        </div>
                        <div className="crop-controls">
                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={() =>
                                    setRotation((r) => r - 90)
                                }
                                aria-label="Rotate left"
                            >
                                <ArrowCounterClockwise weight="bold" />
                            </button>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.05"
                                value={zoom}
                                onChange={(e) =>
                                    setZoom(parseFloat(e.target.value))
                                }
                                aria-label="Zoom"
                            />
                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={() =>
                                    setRotation((r) => r + 90)
                                }
                                aria-label="Rotate right"
                            >
                                <ArrowClockwise weight="bold" />
                            </button>
                        </div>
                        <div className="modal-card__foot">
                            <Button variant="secondary" onClick={cancelCrop}>
                                Cancel
                            </Button>
                            <Button variant="secondary" onClick={applyCrop}>
                                Apply
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {saveModal.open && (
                <div className="account-modal-overlay" role="dialog" aria-modal="true">
                    <div
                        className={
                            "modal-card save-modal save-modal--" +
                            saveModal.status
                        }
                        ref={modalRef}
                        tabIndex={-1}
                        aria-labelledby="account-save-title"
                    >
                        {saveModal.status !== "saving" && (
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeSaveModal}
                                aria-label="Close"
                            >
                                <X weight="bold" />
                            </button>
                        )}
                        <div className="save-modal__icon">
                            {saveModal.status === "success" && (
                                <CheckCircle weight="bold" />
                            )}
                            {saveModal.status === "error" && (
                                <WarningCircle weight="bold" />
                            )}
                        </div>
                        <h3 id="account-save-title">{saveModal.title}</h3>
                        {saveModal.status === "saving" && (
                            <div className="save-progress">
                                <div className="save-progress__bar" />
                            </div>
                        )}
                        {saveModal.message && (
                            <p className="save-modal__message">
                                {saveModal.message}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
