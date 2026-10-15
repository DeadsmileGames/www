import { useEffect, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { ArrowClockwise, Broadcast, Wrench } from "@phosphor-icons/react";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../services/api";

const HEALTH_CHECK_INTERVAL = 15_000;
const OFFLINE_RETRY_INTERVAL = 12_000;
const QUICK_RETRY_DELAY = 1_200;
const HEALTH_TIMEOUT = 4_500;

function MaintenanceScreen({ checking, onRetry }) {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  return (
    <m.main
      className="maintenance-screen"
      role="status"
      aria-live="polite"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.01 : 0.22, ease: "easeOut" }}
    >
      <div className="maintenance-screen__ambient" aria-hidden="true">
        <span className="maintenance-screen__orb maintenance-screen__orb--one" />
        <span className="maintenance-screen__orb maintenance-screen__orb--two" />
        <span className="maintenance-screen__grid" />
      </div>

      <m.div
        className="maintenance-screen__content"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.32, ease: "easeOut" }}
      >
        <img
          className="maintenance-screen__brand"
          src="/assets/branding/deadsmile-mark-mask.svg"
          alt="Deadsmile Games"
          width="74"
          height="54"
        />

        <div className="maintenance-screen__emblem" aria-hidden="true">
          <span className="maintenance-screen__emblem-ring">
            <Wrench size={30} weight="light" />
          </span>
          <span className="maintenance-screen__emblem-signal"><Broadcast size={18} weight="bold" /></span>
        </div>

        <p className="maintenance-screen__eyebrow">{t("DEADSMILE GAMES / SYSTEM NOTICE")}</p>
        <h1>{t("We're performing maintenance.")}</h1>
        <p className="maintenance-screen__message">
          {t("We're updating our systems to bring everything back in a moment.")}
        </p>
        <p className="maintenance-screen__hint">
          {t("Please wait a little and come back later. We'll keep you updated on X.")}
        </p>

        <a
          className="maintenance-screen__social"
          href="https://x.com/DeadsmileGames"
          target="_blank"
          rel="noopener noreferrer"
        >
          @DeadsmileGames <span>{t("on X")}</span>
        </a>

        <button
          className="maintenance-screen__retry"
          type="button"
          onClick={onRetry}
          disabled={checking}
        >
          <ArrowClockwise size={17} className={checking ? "maintenance-screen__retry-icon is-spinning" : "maintenance-screen__retry-icon"} />
          {checking ? t("Checking connection…") : t("Try again")}
        </button>
        <p className="maintenance-screen__status">
          <span className={checking ? "maintenance-screen__status-dot is-checking" : "maintenance-screen__status-dot"} />
          {t("The site will reconnect automatically when service is restored.")}
        </p>
      </div>
    </m.main>
  );
}

export function ApiAvailabilityGate({ children }) {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const availableOnce = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    let timer = null;
    let failures = 0;

    const schedule = (delay) => {
      if (active) timer = window.setTimeout(probe, delay);
    };

    async function probe() {
      if (!active) return;
      setChecking(true);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("API health check failed");
        const result = await response.json();
        if (result?.status !== "ok") throw new Error("API is not ready");
        if (!active) return;

        failures = 0;
        availableOnce.current = true;
        setAvailable(true);
        schedule(HEALTH_CHECK_INTERVAL);
      } catch {
        if (!active) return;
        failures += 1;
        if (availableOnce.current && failures >= 2) setAvailable(false);
        schedule(
          availableOnce.current
            ? failures === 1
              ? QUICK_RETRY_DELAY
              : OFFLINE_RETRY_INTERVAL
            : 5_000,
        );
      } finally {
        window.clearTimeout(timeout);
        if (active) setChecking(false);
      }
    }

    void probe();
    return () => {
      active = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [retryNonce]);

  useEffect(() => {
    if (available) return undefined;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [available]);

  return (
    <AnimatePresence mode="sync" initial={false}>
      {available ? (
        <m.div
          key="site-ready"
          className="api-availability-site"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.2, ease: "easeOut" }}
        >
          {children}
        </m.div>
      ) : (
        <MaintenanceScreen
          key="site-maintenance"
          checking={checking}
          onRetry={() => setRetryNonce((current) => current + 1)}
        />
      )}
    </AnimatePresence>
  );
}
