import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../ui/Toast";
import { friendlyErrorMessage } from "../../services/api";
import { Skeleton } from "../ui/Skeleton";
import { MobileMenu } from "../navigation/MobileMenu";
import { safeImageUrl } from "../../utils/urls";
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
  Globe,
} from "@phosphor-icons/react";

export function Header({ onOpenSearch }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const ref = useRef(null);
  const languageRef = useRef(null);
  const { user, status, logout } = useAuth();
  const avatar = status === "authenticated" ? safeImageUrl(user?.avatarUrl) : null;
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { push } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const f = (e) => {
      if (!ref.current?.contains(e.target)) setAccountOpen(false);
      if (!languageRef.current?.contains(e.target)) setLanguageOpen(false);
    };
    const key = (event) => {
      if (event.key !== "Escape") return;
      if (accountOpen) {
        setAccountOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
      if (languageOpen) {
        setLanguageOpen(false);
        languageRef.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("mousedown", f);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", f);
      document.removeEventListener("keydown", key);
    };
  }, [accountOpen, languageOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    setLanguageOpen(false);
  }, [location.pathname, location.hash]);

  const links = [
    ["/about", t("nav.about")],
    ["/games", t("nav.games")],
    ["/launcher", t("nav.launcher")],
    ["/newswire", t("nav.news")],
    ["/videos", t("nav.videos")],
    ["/support", t("nav.support")],
  ];

  async function signOut() {
    setAccountOpen(false);
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      push(friendlyErrorMessage(error), "error");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="site-header__brand" aria-label="Deadsmile Games">
            <img
              src="/assets/branding/deadsmile-mark-mask.svg"
              alt=""
              className="site-header__mark"
            />
          </Link>
          <nav className="site-header__nav" aria-label={t("Primary")}>
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `site-header__link ${(to.includes("#") ? location.pathname === "/" && location.hash === "#videos" : isActive) ? "is-active" : ""}`
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

            {status === "loading" ? (
              <div role="status" aria-label={t("Loading")}>
                <Skeleton style={{ width: 40, height: 40, borderRadius: "50%" }} />
              </div>
            ) : status === "authenticated" ? (
              <div className="site-header__account-wrap" ref={ref}>
                <button
                  type="button"
                  className="site-header__account-pill"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-expanded={accountOpen}
                  aria-label={t("Account menu")}
                >
                  {avatar && (
                    <img
                      src={avatar}
                      alt=""
                      className="account-avatar"
                      width="32"
                      height="32"
                    />
                  )}
                  <CaretDown weight="bold" size={13} />
                </button>
                {accountOpen && (
                  <div className="site-header__dropdown">
                    <Link to="/account#account" onClick={() => setAccountOpen(false)}>
                      <Gear weight="bold" />
                      {t("Settings")}
                    </Link>
                    <Link
                      to={`/profile/${encodeURIComponent(user.username)}`}
                      onClick={() => setAccountOpen(false)}
                    >
                      <UserCircle weight="bold" />
                      {t("My profile")}
                    </Link>
                    <Link to="/wishlist" onClick={() => setAccountOpen(false)}>
                      <Heart weight="bold" />
                      {t("Wishlist")}
                    </Link>
                    <hr className="dropdown-divider" />
                    <Link to="/presskit" onClick={() => setAccountOpen(false)}>
                      <File weight="bold" />
                      {t("Press Kit")}
                    </Link>
                    <Link to="/privacy" onClick={() => setAccountOpen(false)}>
                      <LockKey weight="bold" />
                      {t("Privacy")}
                    </Link>
                    <hr className="dropdown-divider" />
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={signOut}
                      disabled={signingOut}
                      aria-busy={signingOut}
                    >
                      <SignOut weight="bold" />
                      {t("Log out")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="site-header__signin" aria-label={t("Sign in")}>
                <UserCircle size={24} weight="bold" />
              </Link>
            )}

            <div className="site-header__account-wrap" ref={languageRef}>
              <button
                type="button"
                className="site-header__account-pill"
                onClick={() => setLanguageOpen((open) => !open)}
                aria-expanded={languageOpen}
                aria-label={t("Change language")}
              >
                <Globe size={24} weight="bold" />
              </button>
              {languageOpen && (
                <div className="site-header__dropdown" role="menu" aria-label={t("Language")}>
                  {[
                    ["en", "English"],
                    ["pt-BR", "Português (Brasil)"],
                    ["es", "Español"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={language === value}
                      key={value}
                      onClick={() => {
                        setLanguage(value);
                        setLanguageOpen(false);
                      }}
                    >
                      <span>{label}</span>
                      {language === value && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="site-header__menu-toggle"
              aria-label={t("Open menu")}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <List weight="bold" />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
