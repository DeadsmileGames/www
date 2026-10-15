import { useLayoutEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "../../context/LanguageContext";
import { useCountdown, formatCountdown } from "../../hooks/useCountdown";
import { safeImageUrl } from "../../utils/urls";

export function PremiereBanner({ premiere, onOpen }) {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const bannerRef = useRef(null);
  const seconds = useCountdown(Date.parse(premiere.starts_at));
  const images = (premiere.screenshots?.length ? premiere.screenshots : [premiere.thumbnail])
    .map(safeImageUrl)
    .filter(Boolean)
    .slice(0, 3);
  const waiting = premiere.state === "upcoming" && seconds > 0;

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

  return (
    <motion.button
      type="button"
      ref={bannerRef}
      className="premiere-banner"
      onClick={onOpen}
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      transition={{ duration: reducedMotion ? 0.01 : 0.45, ease: "easeInOut" }}
      aria-label={
        waiting
          ? t("{0} will be available in {1}", {
              0: premiere.title,
              1: formatCountdown(seconds),
            })
          : t("{0} is now playing", { 0: premiere.title })
      }
    >
      <span className="premiere-banner__background" aria-hidden="true">
        {images.map((url) => (
          <img key={url} src={url} alt="" />
        ))}
      </span>
      <span className="premiere-banner__text">
        {waiting
          ? t("{0} will be available in {1}", {
              0: premiere.title,
              1: formatCountdown(seconds),
            })
          : t("{0} is now playing", { 0: premiere.title })}
      </span>
    </motion.button>
  );
}
