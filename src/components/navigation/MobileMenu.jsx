import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowUpRight, X, Heart, GameController } from "@phosphor-icons/react";
import { trapFocus } from "../../utils/dom";
import { safeImageUrl } from "../../utils/urls";
export function MobileMenu({ open, onClose }) {
  const { user, status } = useAuth();
  const avatar = status === "authenticated" ? safeImageUrl(user?.avatarUrl) : null;
  const { t } = useLanguage();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    return trapFocus(panelRef.current, () => closeRef.current());
  }, [open]);
  const links = [
    ["/", "nav.home"],
    ["/about", "nav.about"],
    ["/games", "nav.games"],
    ["/videos", "nav.videos"],
    ["/soundtracks", "nav.soundtracks"],
    ["/launcher", "nav.launcher"],
    ["/newswire", "nav.news"],
    ["/support", "nav.support"],
  ];
  return (
    <div
      className={`mobile-menu ${open ? "mobile-menu--open" : ""}`}
      aria-hidden={!open}
      inert={open ? undefined : ""}
    >
      <div className="mobile-menu__backdrop" onClick={onClose} />
      <div
        className="mobile-menu__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("Navigation")}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="mobile-menu__top">
          <button
            type="button"
            className="mobile-menu__close"
            onClick={onClose}
            aria-label={t("Close menu")}
          >
            <X weight="bold" />
          </button>
        </div>

        <nav className="mobile-menu__nav">
          {links.map(([to, key], i) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="mobile-menu__link"
              style={{
                "--menu-delay": `${i * 45}ms`,
              }}
            >
              <span>{t(key)}</span>
              <ArrowUpRight weight="bold" className="mobile-menu__arrow" />
            </Link>
          ))}

          {status === "authenticated" && (
            <>
              <Link
                to="/library"
                onClick={onClose}
                className="mobile-menu__link"
                style={{
                  "--menu-delay": "290ms",
                }}
              >
                <span>{t("Your library")}</span>
                <GameController weight="bold" className="mobile-menu__arrow" />
              </Link>
              <Link
                to="/wishlist"
                onClick={onClose}
                className="mobile-menu__link"
                style={{
                  "--menu-delay": "335ms",
                }}
              >
                <span>{t("Wishlist")}</span>
                <Heart weight="bold" className="mobile-menu__arrow" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
