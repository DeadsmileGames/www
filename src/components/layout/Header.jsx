import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { MobileMenu } from "../navigation/MobileMenu";
import {
    Gear,
    UserCircle,
    SignOut,
    CaretDown,
    MagnifyingGlass,
    List,
    Heart,
    File,
    LockKey,
} from "@phosphor-icons/react";
import "./Header.css";

export function Header({ onOpenSearch }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const ref = useRef(null);
    const { user, status, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        const f = () => setScrolled(window.scrollY > 18);
        f();
        window.addEventListener("scroll", f, { passive: true });
        return () => window.removeEventListener("scroll", f);
    }, []);

    useEffect(() => {
        const f = (e) => {
            if (!ref.current?.contains(e.target)) setAccountOpen(false);
        };
        document.addEventListener("mousedown", f);
        return () => document.removeEventListener("mousedown", f);
    }, []);

    const links = [
        ["/studio", t("nav.studio")],
        ["/games", t("nav.games")],
        ["/downloads", t("nav.downloads")],
        ["/news", t("nav.news")],
        ["/videos", t("nav.videos")],
        ["/support", t("nav.support")],
    ];

    async function signOut() {
        setAccountOpen(false);
        await logout();
        navigate("/", { replace: true });
    }

    return (
        <>
            <header
                className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}
            >
                <div className="site-header__inner">
                    <Link
                        to="/"
                        className="site-header__brand"
                        aria-label="Deadsmile Games"
                    >
                         <img
                            src="/assets/branding/deadsmile-mark.svg"
                            alt=""
                            className="site-header__mark"
                        />
                    </Link>
                    <nav className="site-header__nav" aria-label="Primary">
                        {links.map(([to, label]) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `site-header__link ${isActive ? "is-active" : ""}`
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="site-header__actions">
                        <button
                            type="button"
                            className="site-header__search"
                            aria-label={t("nav.search")}
                            onClick={onOpenSearch}
                        >
                            <MagnifyingGlass weight="bold" />
                            <span>{t("nav.search")}</span>
                        </button>

                        {status === "authenticated" ? (
                            <div
                                className="site-header__account-wrap"
                                ref={ref}
                            >
                                <button
                                    type="button"
                                    className={`site-header__account-pill ${accountOpen ? "is-open" : ""}`}
                                    onClick={() => setAccountOpen((v) => !v)}
                                    aria-expanded={accountOpen}
                                >
                                    <UserCircle size={24} weight="bold" />
                                    <CaretDown weight="bold" size={13} />
                                </button>
                                {accountOpen && (
                                    <div className="site-header__dropdown">
                                        <Link
                                            to="/account"
                                            onClick={() => setAccountOpen(false)}
                                        >
                                            <Gear weight="bold" />
                                            Settings
                                        </Link>
                                        <Link
                                            to={`/profile/${encodeURIComponent(user.username)}`}
                                            onClick={() => setAccountOpen(false)}
                                        >
                                            <UserCircle weight="bold" />
                                            My profile
                                        </Link>
                                        <Link
                                            to="/wishlist"
                                            onClick={() => setAccountOpen(false)}
                                        >
                                            <Heart weight="bold" />
                                            Wishlist
                                        </Link>
                                        <hr className="dropdown-divider" />
                                        <Link
                                            to="/presskit"
                                            onClick={() => setAccountOpen(false)}
                                        >
                                            <File weight="bold" />
                                            Press Kit
                                        </Link>
                                        <Link
                                            to="/privacy"
                                            onClick={() => setAccountOpen(false)}
                                        >
                                            <LockKey weight="bold" />
                                            Privacy
                                        </Link>
                                        <hr className="dropdown-divider" />
                                        <button onClick={signOut}>
                                            <SignOut weight="bold" />
                                            Log out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="site-header__signin">
                                <UserCircle size={24} weight="bold" />
                            </Link>
                        )}

                        <button
                            type="button"
                            className="site-header__menu-toggle"
                            aria-label="Open menu"
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen(true)}
                        >
                            <List weight="bold" />
                        </button>
                    </div>
                </div>
            </header>
            <MobileMenu
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                onOpenSearch={onOpenSearch}
            />
        </>
    );
}
