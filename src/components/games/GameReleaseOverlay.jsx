import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { safeImageUrl } from "../../utils/urls";
import { trapFocus } from "../../utils/dom";

export function GameReleaseOverlay({ game, onClose }) {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!game) return undefined;
    return trapFocus(panelRef.current, () => closeRef.current?.());
  }, [game?.slug]);

  const backgroundImage =
    safeImageUrl(game?.screenshots?.[0]) ||
    safeImageUrl(game?.heroImage) ||
    safeImageUrl(game?.thumbnail) ||
    "/assets/placeholders/game-cover.svg";
  const posterImage =
    safeImageUrl(game?.coverImage) ||
    safeImageUrl(game?.thumbnail) ||
    safeImageUrl(game?.screenshots?.[0]) ||
    "/assets/placeholders/game-cover.svg";
  const releaseTimestamp = Date.parse(game?.starts_at || "");
  const releaseDate = Number.isFinite(releaseTimestamp)
    ? new Intl.DateTimeFormat(language, {
        dateStyle: "long",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(releaseTimestamp))
    : null;
  const description = String(
    game?.shortDescription || game?.short_description || game?.description || "",
  ).trim();
  const slug = game?.slug;

  return createPortal(
    <AnimatePresence>
      {game && (
        <m.div
          key={game.slug || game.title}
          className="game-release-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-release-overlay-title"
          tabIndex={-1}
          ref={panelRef}
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: reducedMotion ? 0.01 : 0.45, ease: "easeInOut" }}
        >
          <img className="game-release-overlay__background" src={backgroundImage} alt="" />
          <div className="game-release-overlay__scrim" />
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label={t("Close preview")}
          >
            <X weight="bold" />
          </button>

          <div className="game-release-overlay__content">
            <div className="game-release-overlay__poster">
              <img src={posterImage} alt="" />
            </div>
            <div className="game-release-overlay__details">
              <p className="game-release-overlay__eyebrow">{t("Upcoming game")}</p>
              <h1 id="game-release-overlay-title">{game.title}</h1>
              {releaseDate && (
                <p className="game-release-overlay__date">
                  {t("Release date")}: <time dateTime={game.starts_at}>{releaseDate}</time>
                </p>
              )}
              {description && <p className="game-release-overlay__description">{description}</p>}
              {slug && (
                <Link
                  to={`/games/${encodeURIComponent(slug)}`}
                  className="btn btn--primary game-release-overlay__action"
                  onClick={onClose}
                >
                  {t("View game")}
                  <ArrowUpRight weight="bold" />
                </Link>
              )}
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
