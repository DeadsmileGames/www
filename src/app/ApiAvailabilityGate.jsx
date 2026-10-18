import { useEffect, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../services/api";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

const HEALTH_CHECK_INTERVAL = 15_000;
const OFFLINE_RETRY_INTERVAL = 12_000;
const QUICK_RETRY_DELAY = 1_200;
const INITIAL_RETRY_INTERVAL = 5_000;
const HEALTH_TIMEOUT = 4_500;
const PUBLIC_API_PROBE_INTERVAL = 5 * 60_000;
const PUBLIC_API_PROBE_PATHS = [
  "/games?limit=1",
  "/news?limit=1",
  "/newswire?limit=1",
  "/videos?limit=1",
  "/videos/premiere",
  "/downloads",
  "/products",
  "/soundtracks",
  "/special-thanks",
  "/search?q=deadsmile&limit=1",
  "/platform/status",
  "/platform/events?after=0&limit=1",
];

function MaintenanceScreen() {
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
      transition={{ duration: reducedMotion ? 0.01 : 0.2, ease: "easeOut" }}
    >
      <m.div
        className="maintenance-screen__content"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0.01 : 0.24, ease: "easeOut" }}
      >
        <h1>{t("We're performing maintenance.")}</h1>
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
      </m.div>
    </m.main>
  );
}

function CheckingScreen() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  return (
    <m.main
      className="api-availability-checking"
      role="status"
      aria-label={t("Loading")}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.01 : 0.2, ease: "easeOut" }}
    >
      <LoadingSpinner className="api-availability-checking__spinner" />
    </m.main>
  );
}

export function ApiAvailabilityGate({ children }) {
  const [availability, setAvailability] = useState("checking");
  const availableOnce = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    let timer = null;
    let failures = 0;
    let nextPublicApiProbeAt = Date.now() + 30_000 + Math.floor(Math.random() * PUBLIC_API_PROBE_INTERVAL);

    const schedule = (delay) => {
      if (active) timer = window.setTimeout(probe, delay);
    };

    async function probe() {
      if (!active) return;
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
        if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
          throw new Error("API health check returned a non-JSON response");
        }
        const result = await response.json();
        if (result?.status !== "ok" || result?.service !== "Deadsmile Games API") {
          throw new Error("API health contract did not match");
        }

        if (Date.now() >= nextPublicApiProbeAt) {
          await Promise.all(
            PUBLIC_API_PROBE_PATHS.map(async (path) => {
              const probeResponse = await fetch(`${API_BASE_URL}${path}`, {
                method: "GET",
                cache: "no-store",
                credentials: "include",
                headers: { Accept: "application/json" },
                signal: controller.signal,
              });
              if (!probeResponse.ok) throw new Error("Public API route failed");
              if (!probeResponse.headers.get("content-type")?.toLowerCase().includes("application/json")) {
                throw new Error("Public API route returned a non-JSON response");
              }
              const probeResult = await probeResponse.json();
              if (probeResult?.success !== true || !Object.prototype.hasOwnProperty.call(probeResult, "data")) {
                throw new Error("Public API route contract did not match");
              }
            }),
          );
          nextPublicApiProbeAt = Date.now() + PUBLIC_API_PROBE_INTERVAL;
        }

        if (!active) return;

        failures = 0;
        availableOnce.current = true;
        setAvailability("available");
        schedule(HEALTH_CHECK_INTERVAL);
      } catch {
        if (!active) return;
        failures += 1;
        if (failures >= 2) setAvailability("unavailable");
        schedule(
          availableOnce.current
            ? failures === 1
              ? QUICK_RETRY_DELAY
              : OFFLINE_RETRY_INTERVAL
            : INITIAL_RETRY_INTERVAL,
        );
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void probe();
    return () => {
      active = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (availability === "available") return undefined;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [availability]);

  return (
    <AnimatePresence mode="sync" initial={false}>
      {availability === "available" ? (
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
      ) : availability === "checking" ? (
        <CheckingScreen key="site-checking" />
      ) : (
        <MaintenanceScreen key="site-maintenance" />
      )}
    </AnimatePresence>
  );
}
