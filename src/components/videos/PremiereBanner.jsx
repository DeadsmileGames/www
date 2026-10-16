import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { useCountdown, formatCountdown } from "../../hooks/useCountdown";
import { safeImageUrl } from "../../utils/urls";
import { formatReleaseDate, getReleaseTimestamp } from "../../utils/releaseDate";
import { trapFocus } from "../../utils/dom";

export function PremiereBanner({ premiere, onOpen }) {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const bannerRef = useRef(null);
  const previewRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const isGameRelease = premiere.kind === "game";
  const releaseTimestamp = isGameRelease
    ? getReleaseTimestamp(premiere.starts_at || "")
    : Date.parse(premiere.starts_at || "");
  const seconds = useCountdown(releaseTimestamp);
  const images = (premiere.screenshots?.length ? premiere.screenshots : [premiere.thumbnail])
    .map(safeImageUrl)
    .filter(Boolean)
    .slice(0, 3);
  const coverImage =
    safeImageUrl(premiere.coverImage) ||
    safeImageUrl(premiere.thumbnail) ||
    safeImageUrl(premiere.heroImage) ||
    "/assets/placeholders/game-cover.svg";
  const description = String(
    premiere.shortDescription ||
      premiere.short_description ||
      premiere.description ||
      "",
  ).trim();
  const releaseDate =
    isGameRelease && Number.isFinite(releaseTimestamp)
      ? formatReleaseDate(premiere.starts_at, language, { dateStyle: "long" })
      : null;
  const waiting = isGameRelease
    ? seconds > 0
    : premiere.state === "upcoming" && seconds > 0;
  const bannerLabel = isGameRelease
    ? waiting
      ? t("{0} launches in {1}", {
          0: premiere.title,
          1: formatCountdown(seconds),
        })
      : t("{0} releases today", { 0: premiere.title })
    : waiting
      ? t("{0} will be available in {1}", {
          0: premiere.title,
          1: formatCountdown(seconds),
        })
      : t("{0} is now playing", { 0: premiere.title });

  useEffect(() => {
    setExpanded(false);
  }, [premiere.kind, premiere.slug, premiere.id]);

  useLayoutEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return undefined;
    const root = document.documentElement;
    const updateHeight = () => {
      root.style.setProperty(
        "--premiere-banner-height",
        `${Math.ceil(banner.getBoundingClientRect().height)}px`,
      );
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--premiere-banner-height");
    };
  }, []);

  const expandPreview = () => setExpanded(true);
  const collapsePreview = () => setExpanded(false);

  useEffect(() => {
    if (!isGameRelease || !expanded) return undefined;
    return trapFocus(previewRef.current, collapsePreview);
  }, [expanded, isGameRelease]);

  const expandedPreview = createPortal(
    <AnimatePresence>
      {isGameRelease && expanded && (
        <motion.div
          layout
          ref={previewRef}
          className="premiere-banner premiere-banner--expanded premiere-banner--fullscreen"
          role="dialog"
          aria-modal="true"
          aria-labelledby="premiere-banner-preview-title"
          tabIndex={-1}
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: reducedMotion ? 0.01 : 0.45, ease: "easeInOut" }}
        >
          <span className="premiere-banner__background" aria-hidden="true">
            {images.map((url) => (
              <img key={url} src={url} alt="" />
            ))}
          </span>
          <div className="premiere-banner__expanded-content">
            <img
              className="premiere-banner__cover"
              src={coverImage}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/assets/placeholders/game-cover.svg";
              }}
            />
            <div className="premiere-banner__details">
              <h1 className="premiere-banner__title" id="premiere-banner-preview-title">
                {premiere.title}
              </h1>
              {releaseDate && (
                <p className="premiere-banner__date">
                  <span>{t("Release date")}:</span>{" "}
                  <time dateTime={premiere.starts_at}>{releaseDate}</time>
                </p>
              )}
              {description && <p className="premiere-banner__description">{description}</p>}
              {premiere.slug && (
                <div className="premiere-banner__actions">
                  <Link
                    to={`/games/${encodeURIComponent(premiere.slug)}`}
                    className="btn btn--primary"
                    onClick={collapsePreview}
                  >
                    {t("View game")}
                    <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
            <button
              type="button"
              className="premiere-banner__collapse"
              onClick={collapsePreview}
              aria-label={t("Close preview")}
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );

  return (
    <>
      <motion.div
        ref={bannerRef}
        className="premiere-banner"
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.45, ease: "easeInOut" }}
      >
        <span className="premiere-banner__background" aria-hidden="true">
          {images.map((url) => (
            <img key={url} src={url} alt="" />
          ))}
        </span>
        <button
          type="button"
          className="premiere-banner__trigger"
          onClick={isGameRelease ? expandPreview : onOpen}
          aria-expanded={isGameRelease ? expanded : undefined}
        >
          <span className="premiere-banner__text">{bannerLabel}</span>
        </button>
      </motion.div>
      {expandedPreview}
    </>
  );
}
