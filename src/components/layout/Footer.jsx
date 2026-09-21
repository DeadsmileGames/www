import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faItchIo } from '@fortawesome/free-brands-svg-icons';
import { faInstagram, faGithub } from '@fortawesome/free-brands-svg-icons';
import { api } from "../../services/api";

export function Footer() {
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");

    async function subscribe(event) {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setMessage("");
        try {
            await api.post("/newsletter", { email: email.trim() });
            setMessage(
                "Request received. Check your inbox to confirm your subscription.",
            );
            setEmail("");
        } catch (error) {
            setMessage(
                error.message || "Unable to subscribe. Please try again.",
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <footer className="studio-footer">
            <div className="container">
                <div className="newsletter">
                    <h2>Stay in the loop</h2>
                    <p>New games, studio news and the occasional surprise.</p>
                    <form onSubmit={subscribe}>
                        <label htmlFor="newsletter-email">
                            Your email address
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
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                            />
                            <button disabled={busy}>
                                {busy ? "Sending…" : "Join us"}
                            </button>
                        </div>
                        <p role="status">{message}</p>
                        <small>
                            Confirm by email. Unsubscribe whenever you want.{" "}
                            <Link to="/privacy">Privacy policy</Link>
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

                <a
                    className="footer-email"
                    href="mailto:deadsmilegames@gmail.com"
                >
                    deadsmilegames@gmail.com
                </a>
                <nav className="footer-links" aria-label="Footer">
                    <Link to="/games">Games</Link>
                    <Link to="/store">Store</Link>
                    <Link to="/news">News</Link>
                    <Link to="/about">About</Link>
                    <Link to="/support">Support</Link>
                    <Link to="/presskit">Press kit</Link>
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/terms">Terms</Link>
                </nav>
                <p className="copyright">
                    © {new Date().getFullYear()} Deadsmile Games
                </p>
            </div>
        </footer>
    );
}
