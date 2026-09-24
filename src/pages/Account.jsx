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
} from "@phosphor-icons/react";
import { CloudSaves } from "../components/account/CloudSaves";
import { safeImageUrl, safeOAuthItchUrl } from "../utils/urls";
import { FOCUSABLE_SELECTOR, lockBodyScroll } from "../utils/dom";

const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: GearSix },
    { id: "privacy", label: "Privacy", icon: Eye },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "connections", label: "Connections", icon: GameController },
    { id: "cloud", label: "Cloud saves", icon: CloudArrowUp },
];

const CROP_VIEWPORT = 260;
const OUTPUT_SIZE = 420;

export function Account() {
    const { user, logout, refresh } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");

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

    const [privacySaving, setPrivacySaving] =
        useState(false);

    const [privacyMessage, setPrivacyMessage] =
        useState("");

    const [privacyError, setPrivacyError] =
        useState("");
    const [profileError, setProfileError] = useState("");
    const [settingsError, setSettingsError] = useState("");
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
            } catch {}
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

    if (!user) return null;

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    async function setupTwoFactor() {
        setTwoFactorLoading(true);
        try {
            const data = await api.post('/account/totp/setup');
            setTwoFactor({ qrCode: data.qrCodeDataUrl, secret: data.secret, enabled: false });
        } catch {
            setSettingsError('We could not prepare two-factor authentication right now.');
        } finally {
            setTwoFactorLoading(false);
        }
    }

    async function enableTwoFactor(e) {
        e.preventDefault();
        setTwoFactorLoading(true);
        try {
            await api.post('/account/totp/enable', { token: totpToken });
            setTwoFactor(prev => ({ ...prev, enabled: true }));
            setTotpToken('');
        } catch {
            setSettingsError('We could not enable two-factor authentication. Check the code and try again.');
        } finally {
            setTwoFactorLoading(false);
        }
    }

    async function disableTwoFactor(e) {
        e.preventDefault();
        if (!window.confirm('Disable 2FA? You will lose the extra security.')) return;
        setTwoFactorLoading(true);
        try {
            await api.delete('/account/totp/disable', { token: totpToken });
            setTwoFactor({ qrCode: null, secret: null, enabled: false });
            setTotpToken('');
        } catch {
            setSettingsError('We could not disable two-factor authentication. Check the code and try again.');
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
        if (privacySaving || privacyLoading) {
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
        <div className="account-page container">
            <Link to="/" className="back-link">
                <ArrowLeft weight="bold" />
                <span>Back</span>
            </Link>

            <div className="account-page__layout">
                <aside>
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                className={
                                    "account-nav-item" +
                                    (activeTab === tab.id
                                        ? " is-active"
                                        : "")
                                }
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon weight="bold" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                    <span className="account-nav-title">Related</span>
                    <Link
                        to="/wishlist"
                        className="account-nav-item account-page__wishlist"
                    >
                        <Heart weight="bold" />
                        <span>Wishlist</span>
                    </Link>
                </aside>

                <div className="account-page__content">
                    <Reveal>
                        <div className="account-page__hero">
                            <div className="account-page__avatar">
                                <div className="account-page__avatar-inner">
                                    {safeImageUrl(form.avatarUrl) ? (
                                        <img src={safeImageUrl(form.avatarUrl)} alt="" />
                                    ) : (
                                        user.username.slice(0, 1).toUpperCase()
                                    )}
                                </div>
                                <label className="avatar-upload-dot">
                                    <PencilSimple size={24} weight="bold" />
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={onAvatarSelect}
                                    />
                                </label>
                            </div>
                            <div>
                                <h1>{user.username}</h1>
                                {user.createdAt && (
                                    <span>
                                        Created on{" "}
                                        {new Date(
                                            user.createdAt,
                                        ).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "2-digit",
                                            year: "numeric",
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Reveal>

                    {activeTab === "profile" && (
                        <Reveal key="profile">
                            <section className="account-block">
                                <div className="account-block__head">
                                    <h2>Profile Details</h2>
                                    <p>
                                        Manage how your public profile
                                        appears across the site.
                                    </p>
                                </div>
                                <form
                                    className="account-panel"
                                    onSubmit={saveProfile}
                                >
                                    <div className="account-row">
                                        <label htmlFor="acc-username">
                                            Username
                                        </label>
                                        <input
                                            id="acc-username"
                                            value={form.username.toLowerCase()}
                                            onChange={set("username")}
                                            placeholder="@username"
                                            required
                                            minLength={3}
                                            maxLength={24}
                                            pattern="[A-Za-z0-9_\-]+"
                                        />
                                    </div>
                                    <div className="account-row">
                                        <label htmlFor="acc-bio">Bio</label>
                                        <textarea
                                            id="acc-bio"
                                            value={form.bio}
                                            onChange={set("bio")}
                                            placeholder="Write something about yourself."
                                            maxLength={500}
                                            rows="3"
                                        />
                                    </div>
                                    <div className="account-row">
                                        <label htmlFor="acc-website">
                                            Website
                                        </label>
                                        <input
                                            id="acc-website"
                                            type="url"
                                            maxLength={2000}
                                            value={form.websiteUrl}
                                            onChange={set("websiteUrl")}
                                            placeholder="https://…"
                                        />
                                    </div>
                                    <div className="account-row account-row--last">
                                        <label htmlFor="acc-location">
                                            Location
                                        </label>
                                        <input
                                            id="acc-location"
                                            maxLength={120}
                                            value={form.location}
                                            onChange={set("location")}
                                            placeholder="City, Country"
                                        />
                                    </div>
                                    <div className="account-block__foot">
                                        {profileError && (
                                            <p
                                                className="account-page__error"
                                                role="alert"
                                                aria-live="polite"
                                            >
                                                {profileError}
                                            </p>
                                        )}
                                        <Button
                                            type="submit"
                                            variant="secondary"
                                            disabled={saving}
                                        >
                                            Save profile
                                        </Button>
                                    </div>
                                </form>
                            </section>
                        </Reveal>
                    )}

                    {activeTab === "account" && (
                        <Reveal key="account">
                            <section className="account-block">
                                <div className="account-block__head">
                                    <h2>Account</h2>
                                    <p>
                                        Manage your login email and active
                                        session.
                                    </p>
                                </div>
                                <form
                                    className="account-panel"
                                    onSubmit={saveSettings}
                                >
                                    <div className="account-row account-row--last">
                                        <label htmlFor="acc-email">
                                            Email
                                        </label>
                                        
                                        <input
                                            id="acc-email"
                                            type="email"
                                            required
                                            maxLength={254}
                                            autoComplete="email"
                                            value={form.email}
                                            onChange={set("email")}
                                        />

                                        <p>
                                            Current email: {user.email}
                                        </p>

                                        <p>
                                            Enter your new email address and your
                                            current password to request the change.
                                        </p>

                                        <label htmlFor="acc-email-password">
                                            Current account password
                                        </label>

                                        <input
                                            id="acc-email-password"
                                            type="password"
                                            required
                                            minLength={1}
                                            maxLength={128}
                                            autoComplete="current-password"
                                            value={emailPassword}
                                            onChange={(e) =>
                                                setEmailPassword(e.target.value)
                                            }
                                        />

                                        {emailMessage && (
                                            <p role="status">
                                                {emailMessage}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn--primary"
                                            style={{
                                                width: '100%',
                                                justifyContent: 'center',
                                                marginTop: 12,
                                            }}
                                            onClick={() => navigate('/forgot-password')}
                                            >
                                            <LockKey size={22} weight="bold" />

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                }}
                                            >
                                                <span>Reset your password.</span>
                                            </div>

                                            <CaretRight size={20} />
                                        </button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Sending confirmation..."
                                                : "Request email change"}
                                        </Button>
                                    </div>
                                    <div className="account-block__foot">
                                        {settingsError && (
                                            <p
                                                className="account-page__error"
                                                role="alert"
                                                aria-live="polite"
                                            >
                                                {settingsError}
                                            </p>
                                        )}
                                    </div>
                                </form>

                                <div className="account-panel" style={{marginTop: 20}}>
                                    <div className="account-row account-row--last account-row--inline">
                                        <div>
                                            <strong>Session</strong>
                                            <p>Sign out from this device.</p>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            onClick={signOut}
                                        >
                                            Log out
                                        </Button>
                                    </div>
                                </div>

                                <div className="account-block__head account-block__head--danger" style={{marginTop: 20}}>
                                    <h2>Delete account</h2>
                                    <p>
                                        This is permanent. You will lose
                                        access to your public profile and
                                        cannot undo this action.
                                    </p>
                                </div>
                                <form
                                    className="account-panel account-panel--danger"
                                    onSubmit={del}
                                >
                                    <div className="account-row account-row--last">
                                        <label htmlFor="acc-password">
                                            Current password
                                        </label>
                                        <input
                                            id="acc-password"
                                            type="password"
                                            required
                                            minLength={8}
                                            maxLength={128}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="account-block__foot">
                                        {deleteError && (
                                            <p
                                                className="account-page__error"
                                                role="alert"
                                                aria-live="polite"
                                            >
                                                {deleteError}
                                            </p>
                                        )}
                                        <Button
                                            type="submit"
                                            variant="danger"
                                            className="btn btn--danger"
                                            disabled={deleting}
                                        >
                                            Delete account
                                        </Button>
                                    </div>
                                </form>
                            </section>
                        </Reveal>
                    )}

                    {activeTab === "privacy" && (
                        <Reveal key="privacy">
                            <section className="account-block">

                                <div className="account-block__head">
                                    <h2>Privacy</h2>

                                    <p>
                                        Manage what other people can see
                                        on your public profile.
                                    </p>
                                </div>

                                <div className="account-panel">

                                    <h3>Privacy preferences</h3>

                                    <p>
                                        Your game activity and achievements
                                        are private by default.
                                    </p>

                                    {privacyLoading ? (
                                        <p>Loading preferences...</p>
                                    ) : (
                                        <>
                                            <div className="account-row">

                                                <label>
                                                    <input
                                                        type="checkbox"

                                                        checked={
                                                            privacy.shareGameActivity
                                                        }

                                                        onChange={(e) => {
                                                            const checked =
                                                                e.target.checked;

                                                            setPrivacy((current) => ({
                                                                ...current,

                                                                shareGameActivity:
                                                                    checked,

                                                                sharePlaytime:
                                                                    checked
                                                                        ? current.sharePlaytime
                                                                        : false
                                                            }));
                                                        }}
                                                    />

                                                    Share recently played games
                                                </label>

                                                <p>
                                                    Allow other people to see
                                                    which games you have played.
                                                </p>

                                            </div>

                                            <div className="account-row">

                                                <label>
                                                    <input
                                                        type="checkbox"

                                                        checked={
                                                            privacy.sharePlaytime
                                                        }

                                                        disabled={
                                                            !privacy.shareGameActivity
                                                        }

                                                        onChange={(e) => {
                                                            setPrivacy((current) => ({
                                                                ...current,

                                                                sharePlaytime:
                                                                    e.target.checked
                                                            }));
                                                        }}
                                                    />

                                                    Show playtime and session count
                                                </label>

                                                <p>
                                                    Show how long you have played
                                                    and how many sessions you
                                                    have completed.
                                                </p>

                                            </div>

                                            <div className="account-row account-row--last">

                                                <label>
                                                    <input
                                                        type="checkbox"

                                                        checked={
                                                            privacy.shareAchievements
                                                        }

                                                        onChange={(e) => {
                                                            setPrivacy((current) => ({
                                                                ...current,

                                                                shareAchievements:
                                                                    e.target.checked
                                                            }));
                                                        }}
                                                    />

                                                    Share achievements
                                                </label>

                                                <p>
                                                    Allow other people to see
                                                    your unlocked achievements.
                                                </p>

                                            </div>

                                            <div className="account-block__foot">

                                                {privacyError && (
                                                    <p
                                                        className="account-page__error"
                                                        role="alert"
                                                    >
                                                        {privacyError}
                                                    </p>
                                                )}

                                                {privacyMessage && (
                                                    <p role="status">
                                                        {privacyMessage}
                                                    </p>
                                                )}

                                                <Button
                                                    type="button"
                                                    variant="primary"

                                                    onClick={savePrivacy}

                                                    disabled={
                                                        privacySaving ||
                                                        privacyLoading
                                                    }
                                                >
                                                    {privacySaving
                                                        ? "Saving..."
                                                        : "Save privacy preferences"}
                                                </Button>

                                            </div>
                                        </>
                                    )}

                                </div>

                            </section>
                        </Reveal>
                    )}

                    {activeTab === "security" && (
                        <Reveal key="security">
                            <section className="account-block">
                                <div className="account-block__head">
                                    <h2>Two-Factor Authentication</h2>
                                    <p>
                                        Add an extra layer of security to your account.
                                    </p>
                                </div>
                                <div className="account-panel">
                                    {twoFactor.enabled ? (
                                        <form onSubmit={disableTwoFactor}>
                                            <div className="account-row account-row--inline">
                                                <div>
                                                    <strong style={{ color: '#58a56b' }}>
                                                        <CheckCircle weight="bold" size={16} style={{ marginRight: 8 }} />
                                                        2FA is enabled
                                                    </strong>
                                                    <p>Your account is protected with an authenticator app.</p>
                                                </div>
                                            </div>
                                            <div className="account-row">
                                                <label htmlFor="totp-disable">Enter current TOTP code to disable</label>
                                                <input
                                                    id="totp-disable"
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={6}
                                                    value={totpToken}
                                                    onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    placeholder="6-digit code"
                                                    required
                                                />
                                            </div>
                                            <div className="account-block__foot">
                                                <Button
                                                    type="submit"
                                                    variant="danger"
                                                    disabled={twoFactorLoading}
                                                >
                                                    {twoFactorLoading ? 'Disabling…' : 'Disable 2FA'}
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            {twoFactor.qrCode ? (
                                                <form onSubmit={enableTwoFactor}>
                                                    <div className="account-row">
                                                        <p>Scan the QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, etc.).</p>
                                                        <img
                                                            src={safeImageUrl(twoFactor.qrCode)}
                                                            alt="QR Code for 2FA"
                                                            style={{ maxWidth: 200, margin: '10px 0' }}
                                                        />
                                                        <p>
                                                            <small>
                                                                Secret (backup): <strong>{twoFactor.secret}</strong>
                                                            </small>
                                                        </p>
                                                    </div>
                                                    <div className="account-row">
                                                        <label htmlFor="totp-enable">Enter the 6-digit code from the app</label>
                                                        <input
                                                            id="totp-enable"
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={6}
                                                            value={totpToken}
                                                            onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                            placeholder="123456"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="account-block__foot">
                                                        <Button
                                                            type="submit"
                                                            variant="secondary"
                                                            disabled={twoFactorLoading}
                                                        >
                                                            {twoFactorLoading ? 'Enabling…' : 'Enable 2FA'}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => setTwoFactor({ qrCode: null, secret: null, enabled: false })}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="account-row account-row--inline">
                                                    <div>
                                                        <strong>Protect your account</strong>
                                                        <p>Set up two‑factor authentication using an authenticator app.</p>
                                                    </div>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={setupTwoFactor}
                                                        disabled={twoFactorLoading}
                                                    >
                                                        {twoFactorLoading ? 'Loading…' : 'Set up 2FA'}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </section>
                        </Reveal>
                    )}

                    {activeTab === "connections" && (
                        <Reveal key="connections">
                            <section className="account-block">
                                <div className="account-block__head">
                                    <h2>Connected accounts</h2>
                                    <p>Link itch.io to verify purchases and keep your Deadsmile Games library available on the site and launcher.</p>
                                </div>
                                <div className="account-panel">
                                    <div className="account-row account-row--inline connection-row">
                                        <div className="connection-row__identity">
                                            <span className="connection-row__icon"><GameController weight="bold" /></span>
                                            <div>
                                                <strong>itch.io</strong>
                                                <p>
                                                    {itch.loading
                                                        ? 'Checking connection…'
                                                        : itch.connected
                                                            ? `Connected as ${itch.username}`
                                                            : 'Not connected'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="connection-row__actions">
                                            {itch.connected ? (
                                                <>
                                                    <Button type="button" variant="primary" onClick={syncItch} disabled={itchBusy}>Refresh library</Button>
                                                    <Button type="button" variant="danger" onClick={disconnectItch} disabled={itchBusy}>Disconnect</Button>
                                                </>
                                            ) : (
                                                <Button type="button" variant="primary" onClick={connectItch} disabled={itchBusy || itch.loading || itch.unavailable}>Connect itch.io</Button>
                                            )}
                                        </div>
                                    </div>
                                    {itchMessage && <div className="connection-message" role="status">{itchMessage}</div>}
                                </div>
                            </section>
                        </Reveal>
                    )}

                    {activeTab === "cloud" && (
                        <Reveal key="cloud">
                            <section className="account-block">
                                <div className="account-block__head">
                                    <h2>Cloud saves</h2>
                                    <p>Back up, restore and manage saves for supported games in your library.</p>
                                </div>
                                <CloudSaves />
                            </section>
                        </Reveal>
                    )}
                </div>
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
