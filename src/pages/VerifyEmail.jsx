import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export function VerifyEmail() {
    const location = useLocation();
    const { refresh } = useAuth();

    const [token] = useState(() => {
        const params = new URLSearchParams(
            window.location.search
        );

        return params.get("token");
    });

    const [status, setStatus] = useState(
        token ? "loading" : "ready"
    );

    const [message, setMessage] = useState(
        token
            ? "Confirming your email..."
            : "Check your inbox for a confirmation link."
    );

    const attempted = useRef(false);

    useEffect(() => {
        // Remove o token da barra de enderecos.
        if (window.location.search) {
            window.history.replaceState(
                window.history.state,
                "",
                window.location.pathname
            );
        }

        if (!token || attempted.current) {
            return;
        }

        attempted.current = true;

        async function confirm() {
            try {
                const result = await api.post(
                    "/auth/confirm-email",
                    { token }
                );

                setStatus("success");

                if (result?.emailChanged) {
                    setMessage(
                        "Your email has been changed successfully. " +
                        "Please sign in again using your new email address."
                    );

                    // A troca de e-mail invalida as sessoes antigas.
                    await refresh();
                } else {
                    setMessage(
                        "Your email has been confirmed! " +
                        "You can now sign in to your account."
                    );
                }
            } catch (error) {
                setStatus("error");

                setMessage(
                    error?.message ||
                    "This confirmation link is invalid or has expired."
                );
            }
        }

        confirm();
    }, [token, refresh]);

    return (
        <section className="newsletter-action page-section">
            <div className="newsletter-action__card">

                <h1>Email verification</h1>

                <p role="status">
                    {message}
                </p>

                {location.state?.registered && (
                    <p>
                        Your account has been created.
                        Confirm your email address before signing in.
                    </p>
                )}

                {status === "loading" && (
                    <p>
                        Verifying your confirmation link...
                    </p>
                )}

                {status === "error" && (
                    <p>
                        If your link has expired, return to
                        the login page and request another one.
                    </p>
                )}

                {status !== "loading" && (
                    <Link
                        className="btn btn--primary"
                        to="/login"
                    >
                        Go to login
                    </Link>
                )}

            </div>
        </section>
    );
}