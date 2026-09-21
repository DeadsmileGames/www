import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";

export function Login() {
    const { login, verifyTwoFactor } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const recaptchaRef = useRef(null);
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);

    const fromLocation = location.state?.from;
    const from = fromLocation?.pathname
        ? `${fromLocation.pathname}${fromLocation.search || ""}${fromLocation.hash || ""}`
        : "/account";

    function handleRecaptchaChange(token) {
        setRecaptchaToken(token);
        setError(null);
    }

    function handleRecaptchaExpired() {
        setRecaptchaToken(null);
    }

    function handleRecaptchaError() {
        setRecaptchaToken(null);
        setError("Unable to load reCAPTCHA. Please try again.");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        if (!recaptchaSiteKey) {
            setError("Security verification is not configured. Please try again later.");
            return;
        }

        if (!recaptchaToken) {
            setError("Please complete the reCAPTCHA verification.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await login(
                form.email,
                form.password,
                recaptchaToken,
            );

            if (response?.requiresTwoFactor) {
                setTwoFactorRequired(true);
                setTwoFactorCode("");
                return;
            }

            navigate(from, { replace: true });
        } catch (err) {
            setError(err?.message || "Unable to sign in. Please try again.");
            setRecaptchaToken(null);
            recaptchaRef.current?.reset();
        } finally {
            setSubmitting(false);
        }
    }

    async function handleTwoFactorSubmit(e) {
        e.preventDefault();
        setError(null);

        const token = twoFactorCode.replace(/\D/g, "").slice(0, 6);

        if (token.length !== 6) {
            setError("Enter the 6-digit code from your authenticator app.");
            return;
        }

        setTwoFactorSubmitting(true);

        try {
            await verifyTwoFactor(token);

            navigate(from, { replace: true });
        } catch (err) {
            setError(
                err?.message || "Unable to verify the authentication code.",
            );
        } finally {
            setTwoFactorSubmitting(false);
        }
    }

    function cancelTwoFactor() {
        setTwoFactorRequired(false);
        setTwoFactorCode("");
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
        setError(null);
    }

    return (
        <div className="auth-page">
            <div className="auth-page__card">
                <Link to="/" className="back-link">
                    <ArrowLeft weight="bold" />
                    <span>Back</span>
                </Link>

                <h1>
                    {twoFactorRequired
                        ? "Two-Factor Authentication"
                        : t("auth.login")}
                </h1>

                {error && (
                    <p
                        className="auth-page__error"
                        role="alert"
                        aria-live="polite"
                    >
                        {error}
                    </p>
                )}

                {!twoFactorRequired ? (
                    <form onSubmit={handleSubmit}>
                        <div className="auth-page__field">
                            <label htmlFor="email">{t("auth.email")}</label>

                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                maxLength={254}
                                value={form.email}
                                onChange={(e) =>
                                    setForm((current) => ({
                                        ...current,
                                        email: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="auth-page__field">
                            <label htmlFor="password">
                                {t("auth.password")}
                            </label>

                            <input
                                id="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                maxLength={128}
                                value={form.password}
                                onChange={(e) =>
                                    setForm((current) => ({
                                        ...current,
                                        password: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="auth-page__recaptcha">
                            {recaptchaSiteKey ? (
                                <ReCAPTCHA
                                    ref={recaptchaRef}
                                    sitekey={recaptchaSiteKey}
                                    theme="dark"
                                    onChange={handleRecaptchaChange}
                                    onExpired={handleRecaptchaExpired}
                                    onErrored={handleRecaptchaError}
                                />
                            ) : (
                                <p className="auth-page__error" role="alert">Security verification is unavailable.</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="auth-page__submit"
                            disabled={submitting || !recaptchaToken}
                        >
                            {submitting ? t("auth.signing") : t("auth.login")}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleTwoFactorSubmit} noValidate>
                        <div className="auth-page__field">
                            <label htmlFor="twoFactorCode">
                                Authenticator Code
                            </label>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <ShieldCheck
                                    weight="bold"
                                    size={20}
                                    style={{ color: "#888" }}
                                />

                                <input
                                    id="twoFactorCode"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={twoFactorCode}
                                    onChange={(e) =>
                                        setTwoFactorCode(
                                            e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 6),
                                        )
                                    }
                                    placeholder="6-digit code"
                                    required
                                    autoFocus
                                />
                            </div>

                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#777",
                                    marginTop: 8,
                                }}
                            >
                                Enter the code from your authenticator app.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="auth-page__submit"
                            disabled={twoFactorSubmitting}
                        >
                            {twoFactorSubmitting
                                ? "Verifying…"
                                : "Verify & Sign In"}
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={cancelTwoFactor}
                            disabled={twoFactorSubmitting}
                            style={{ marginTop: 12 }}
                        >
                            Back to sign in
                        </Button>
                    </form>
                )}
                
                {!twoFactorRequired && (
                    <p style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
                        <Link
                        to="/forgot-password"
                        style={{ color: '#888', fontSize: '0.8rem' }}
                        >
                        Forgot password?
                        </Link>
                    </p>
                    )}

                {!twoFactorRequired && (
                    <p className="auth-page__footer">
                        {t("auth.newTo")}{" "}
                        <Link to="/register">{t("auth.create")}</Link>
                    </p>
                )}

                <div className="auth-page__recaptcha-footer">
                    {" "}
                    <span>Protected by reCAPTCHA</span>
                </div>
            </div>
        </div>
    );
}
