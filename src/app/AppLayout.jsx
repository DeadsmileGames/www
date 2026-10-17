import { useLanguage } from "../context/LanguageContext";
import { useGames } from "../hooks/useGames";
import { SkeletonPage } from "../components/ui/Skeleton";
import { Suspense, useEffect, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { SearchOverlay } from "../components/search/SearchOverlay";
import { CookieConsent } from "../components/ui/CookieConsent";
import { PremiereBanner } from "../components/videos/PremiereBanner";
import { VideoOverlay } from "../components/videos/VideoOverlay";
import { usePremiere } from "../hooks/usePremiere";
import { getReleaseTimestamp } from "../utils/releaseDate";
import { loadMicrosoftStoreCovers } from "../utils/microsoftStoreCover";
import { useServerClock } from "../hooks/useServerClock";

const WINDOWS_95_STYLESHEET_ID = "deadsmile-windows95-css";
const WINDOWS_95_STYLESHEET_URL = "https://unpkg.com/98.css@0.1.21";

function getStandardSiteUrl() {
  const pathname = window.location.pathname.replace(/^\/1995(?=\/|$)/, "") || "/";
  return `${pathname}${window.location.search}${window.location.hash}`;
}

export function AppLayout({ windows95Mode = false }) {
  const { t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [windows95ActionPending, setWindows95ActionPending] = useState(false);
  const [windows95Seconds, setWindows95Seconds] = useState(5);
  const [premiereOpen, setPremiereOpen] = useState(false);
  const bannerClock = useServerClock();
  const [upcomingStoreCover, setUpcomingStoreCover] = useState(null);
  const premiere = usePremiere();
  const { games: gamesNearRelease = [] } = useGames({ limit: 48 });

  const now = bannerClock;
  const monthFromNow = new Date(now ?? 0);
  const currentDay = monthFromNow.getDate();
  monthFromNow.setDate(1);
  monthFromNow.setMonth(monthFromNow.getMonth() + 1);
  const lastDayOfNextMonth = new Date(
    monthFromNow.getFullYear(),
    monthFromNow.getMonth() + 1,
    0,
  ).getDate();
  monthFromNow.setDate(Math.min(currentDay, lastDayOfNextMonth));
  const nextRelease = now === null ? null : gamesNearRelease
    .map((game) => {
      const value = game.releaseDate || game.release_date;
      const timestamp = getReleaseTimestamp(value || "");
      return { game, timestamp };
    })
    .filter(
      (item) =>
        item.game.status !== "released" &&
        Number.isFinite(item.timestamp) &&
        item.timestamp > now &&
        item.timestamp <= monthFromNow.getTime(),
    )
    .sort((a, b) => a.timestamp - b.timestamp)[0] || null;

  const nextReleaseGame = nextRelease?.game || null;

  const nextReleaseGameId = nextReleaseGame?.id;
  const nextReleaseGameSlug = nextReleaseGame?.slug;

  useEffect(() => {
    let cancelled = false;
    setUpcomingStoreCover(null);
    if (!nextReleaseGameSlug) {
      return () => {
        cancelled = true;
      };
    }

    const gameForCover = {
      id: nextReleaseGameId,
      slug: nextReleaseGameSlug,
    };
    void loadMicrosoftStoreCovers([gameForCover], { includeUnknown: true }).then((covers) => {
      if (cancelled) return;
      setUpcomingStoreCover(
        covers.get(String(nextReleaseGameId ?? nextReleaseGameSlug)) || null,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [nextReleaseGameId, nextReleaseGameSlug]);

  const upcomingGameBanner = nextRelease
    ? {
        kind: "game",
        state: "upcoming",
        title: nextRelease.game.title,
        starts_at: new Date(nextRelease.timestamp).toISOString(),
        slug: nextRelease.game.slug,
        thumbnail:
          upcomingStoreCover ||
          nextRelease.game.coverImage ||
          nextRelease.game.cover_image ||
          nextRelease.game.heroImage ||
          nextRelease.game.hero_image ||
          null,
        screenshots: [
          nextRelease.game.heroImage || nextRelease.game.hero_image,
          nextRelease.game.coverImage || nextRelease.game.cover_image,
        ].filter(Boolean),
        heroImage: nextRelease.game.heroImage || nextRelease.game.hero_image || null,
        databaseCoverImage: nextRelease.game.coverImage || nextRelease.game.cover_image || null,
        coverImage: upcomingStoreCover || nextRelease.game.coverImage || nextRelease.game.cover_image || null,
        shortDescription:
          nextRelease.game.shortDescription ||
          nextRelease.game.short_description ||
          nextRelease.game.description ||
          "",
        description: nextRelease.game.shortDescription ||
          nextRelease.game.short_description ||
          nextRelease.game.description ||
          "",
      }
    : null;
  const premiereTimestamp = Date.parse(premiere?.starts_at || "");
  const hasFuturePremiere =
    now !== null &&
    premiere?.state === "upcoming" &&
    Number.isFinite(premiereTimestamp) &&
    premiereTimestamp > now;
  const bannerContent =
    upcomingGameBanner &&
    (!hasFuturePremiere || nextRelease.timestamp < premiereTimestamp)
      ? upcomingGameBanner
      : premiere;

  const location = useLocation();
  const isSpecialThanksPage = location.pathname === "/specialthanks";
  const outlet = useOutlet();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setSearchOpen(false);

    if (location.hash) {
      const frame = requestAnimationFrame(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
      });

      return () => cancelAnimationFrame(frame);
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const canonicalUrl = new URL(location.pathname || "/", window.location.origin).toString();

    const canonical = document.querySelector('link[rel="canonical"]');

    const openGraphUrl = document.querySelector('meta[property="og:url"]');

    canonical?.setAttribute("href", canonicalUrl);
    openGraphUrl?.setAttribute("content", canonicalUrl);
  }, [location.pathname]);

  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ].includes(location.pathname);

  useEffect(() => {
    const root = document.documentElement;
    const existingLink = document.getElementById(WINDOWS_95_STYLESHEET_ID);

    if (!windows95Mode) {
      root.classList.remove("windows95-mode");
      existingLink?.remove();
      return undefined;
    }

    root.classList.add("windows95-mode");
    let stylesheet = existingLink;
    if (!stylesheet) {
      stylesheet = document.createElement("link");
      stylesheet.id = WINDOWS_95_STYLESHEET_ID;
      stylesheet.rel = "stylesheet";
      stylesheet.href = WINDOWS_95_STYLESHEET_URL;
      document.head.appendChild(stylesheet);
    }

    return () => {
      root.classList.remove("windows95-mode");
      stylesheet?.remove();
    };
  }, [windows95Mode]);

  useEffect(() => {
    if (!windows95Mode || !windows95ActionPending) return undefined;

    const destination = getStandardSiteUrl();
    const startedAt = Date.now();
    setWindows95Seconds(5);

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setWindows95Seconds(Math.max(0, Math.ceil((5000 - elapsed) / 1000)));
    }, 100);
    const timeoutId = window.setTimeout(() => {
      window.location.replace(destination);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [windows95Mode, windows95ActionPending]);

  function handleWindows95ClickCapture(event) {
    if (!windows95Mode || windows95ActionPending) return;
    const target = event.target instanceof Element
      ? event.target
      : event.target?.parentElement;
    if (!target || target.closest("[data-windows95-dialog]")) return;

    const actionButton = target.closest(
      'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]',
    );
    if (actionButton) {
      if (actionButton.disabled || actionButton.getAttribute("aria-disabled") === "true") return;
      event.preventDefault();
      event.stopPropagation();
      setWindows95ActionPending(true);
      setWindows95Seconds(5);
      return;
    }

    const anchor = target.closest("a[href]");
    if (!anchor || anchor.hasAttribute("download")) return;
    if (anchor.target && anchor.target !== "_self") return;
    const rawHref = anchor.getAttribute("href") || "";
    if (rawHref.startsWith("#")) return;

    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (/^\/1995(?:\/|$)/.test(destination.pathname)) return;

    event.preventDefault();
    event.stopPropagation();
    window.location.assign(
      `/1995${destination.pathname}${destination.search}${destination.hash}`,
    );
  }

  function handleWindows95SubmitCapture(event) {
    if (!windows95Mode || windows95ActionPending) return;
    if (event.target instanceof HTMLFormElement) {
      event.preventDefault();
      event.stopPropagation();
      setWindows95ActionPending(true);
      setWindows95Seconds(5);
    }
  }

  return (
    <div
      className={windows95Mode ? "windows95-app" : "app-layout-shell"}
      onClickCapture={handleWindows95ClickCapture}
      onSubmitCapture={handleWindows95SubmitCapture}
    >
      {!isSpecialThanksPage && (
        <a href="#main-content" className="skip-link">
          {t("Skip to content")}
        </a>
      )}

      {!isSpecialThanksPage && (
        <div className={`premiere-shell ${bannerContent && !isAuthPage ? "premiere-shell--with-banner" : ""}`}>
          {bannerContent && !isAuthPage && (
            <PremiereBanner
              premiere={bannerContent}
              onOpen={() => {
                if (bannerContent.kind !== "game") setPremiereOpen(true);
              }}
            />
          )}
          {!isAuthPage && <Header onOpenSearch={() => setSearchOpen(true)} searchOpen={searchOpen} />}
        </div>
      )}

      <main id="main-content">
        <Suspense fallback={<SkeletonPage path={location.pathname} />}>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              className="page-transition"
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reducedMotion ? 0.01 : 0.2,
                ease: "easeInOut",
              }}
              style={{
                width: "100%",
                minHeight: "65vh",
              }}
            >
              {outlet}
            </m.div>
          </AnimatePresence>
        </Suspense>
      </main>

      {!isAuthPage && !isSpecialThanksPage && <Footer />}

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        hasPremiere={Boolean(bannerContent && !isAuthPage && !isSpecialThanksPage)}
      />

      <VideoOverlay
        videoId={premiereOpen && premiere ? premiere.id : null}
        onClose={() => setPremiereOpen(false)}
      />

      {!isAuthPage && <CookieConsent />}

      {windows95Mode && windows95ActionPending && (
        <div className="windows95-action-overlay" data-windows95-dialog>
          <section
            className="window windows95-action-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="windows95-action-title"
            aria-describedby="windows95-action-message"
          >
            <div className="title-bar">
              <span className="title-bar-text" id="windows95-action-title">
                {t("Windows 95 mode")}
              </span>
            </div>
            <div className="window-body">
              <p id="windows95-action-message">
                {t("This action cannot be completed in Windows 95 mode.")}
              </p>
              <p aria-live="polite">
                {t("Redirecting to the standard site in {seconds} seconds…", {
                  seconds: windows95Seconds,
                })}
              </p>
              <div
                className="progress-indicator windows95-redirect-progress"
                role="progressbar"
                aria-label={t("Redirect countdown")}
                aria-valuemin="0"
                aria-valuemax="5"
                aria-valuenow={5 - windows95Seconds}
              >
                <span className="progress-indicator-bar" />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
