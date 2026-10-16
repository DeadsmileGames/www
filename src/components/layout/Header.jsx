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
  GameController,
  File,
  LockKey,
  Globe,
} from "@phosphor-icons/react";

function LanguageFlag({ language }) {
  const common = {
    viewBox: "0 0 24 18",
    className: "language-option__flag",
    "aria-hidden": true,
    focusable: "false",
  };

  const details = {
    en: (
      <>
        <path d="M4 4.2 20 14.8M20 4.2 4 14.8" stroke="#1a1a1a" strokeWidth="2" />
        <path d="M12 3.5v12.8M3.5 9h17" stroke="#1a1a1a" strokeWidth="4" />
        <path d="M12 3.5v12.8M3.5 9h17" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
    "pt-BR": (
      <>
        <path d="m12 4 7 5-7 5-7-5 7-5Z" fill="#1a1a1a" />
        <circle cx="12" cy="9" r="2.6" fill="currentColor" />
        <path d="M9.8 8.5c1.5-.4 2.8-.2 4.1.4" stroke="#1a1a1a" strokeWidth=".75" />
      </>
    ),
    es: (
      <>
        <path d="M3 7h18v4H3z" fill="#1a1a1a" />
        <path d="M8 8.4h2.2v2.2H8z" fill="currentColor" />
      </>
    ),
    "zh-CN": (
      <>
        <path d="m7 5 .7 1.5 1.7.2-1.3 1.1.4 1.7L7 8.6l-1.5.9.4-1.7-1.3-1.1 1.7-.2L7 5Z" fill="#1a1a1a" />
        <path d="m12.2 5 .3.8.9.1-.7.6.2.9-.7-.5-.7.5.2-.9-.7-.6.9-.1.3-.8Zm3.5 2-.3.8-.9.1.7.6-.2.9.7-.5.7.5-.2-.9.7-.6-.9-.1-.3-.8Zm-.6 4 .3.8.9.1-.7.6.2.9-.7-.5-.7.5.2-.9-.7-.6.9-.1.3-.8Z" fill="#1a1a1a" />
      </>
    ),
    hi: (
      <>
        <path d="M3 6.8h18M3 11.2h18" stroke="#1a1a1a" strokeWidth="1.5" />
        <circle cx="12" cy="9" r="2" fill="none" stroke="#1a1a1a" strokeWidth=".9" />
        <circle cx="12" cy="9" r=".55" fill="#1a1a1a" />
      </>
    ),
    ar: (
      <>
        <path d="M5 7.2c1.4-1.3 2.4.8 3.7-.3 1.3-1.2 2.6.8 4-.1 1.5-1 2.2.7 3.3-.1" stroke="#1a1a1a" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M5 9.5h12M7 12.4h10M5 14.2h6" stroke="#1a1a1a" strokeWidth="1.1" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <svg {...common}>
      <path d="M2.5 2.5h19v12.8L12 13l-9.5 2.3V2.5Z" fill="currentColor" />
      {details[language] || details.en}
    </svg>
  );
}

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
    ["/soundtracks", t("nav.soundtracks")],
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
                    <Link to="/library" onClick={() => setAccountOpen(false)}>
                      <GameController weight="bold" />
                      {t("Your library")}
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
                    ["zh-CN", "简体中文"],
                    ["hi", "हिन्दी"],
                    ["ar", "العربية"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={language === value}
                      key={value}
                      dir={value === "ar" ? "rtl" : "ltr"}
                      onClick={() => {
                        setLanguage(value);
                        setLanguageOpen(false);
                      }}
                    >
                      <LanguageFlag language={value} />
                      <span>{label}</span>
                      {language === value && <span className="language-option__check" aria-hidden="true">✓</span>}
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
