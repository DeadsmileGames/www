import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { trapFocus } from "../../utils/dom";

export function MobileMenu({ open, onClose }) {
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
        id="mobile-navigation"
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

        <nav className="mobile-menu__nav" aria-label={t("Primary")}>
          {links.map(([to, key], i) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `mobile-menu__link${isActive ? " is-active" : ""}`
              }
              style={{ "--menu-delay": `${i * 45}ms` }}
            >
              <span>{t(key)}</span>
              <ArrowUpRight weight="bold" className="mobile-menu__arrow" />
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
