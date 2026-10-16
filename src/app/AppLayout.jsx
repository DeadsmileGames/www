import { useLanguage } from "../context/LanguageContext";
import { useGames } from "../hooks/useGames";
import { SkeletonPage } from "../components/ui/Skeleton";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { SearchOverlay } from "../components/search/SearchOverlay";
import { CookieConsent } from "../components/ui/CookieConsent";
import { PremiereBanner } from "../components/videos/PremiereBanner";
import { VideoOverlay } from "../components/videos/VideoOverlay";
import { useAuth } from "../hooks/useAuth";
import { usePremiere } from "../hooks/usePremiere";
import { safeImageUrl } from "../utils/urls";
import { getReleaseTimestamp } from "../utils/releaseDate";
import { loadMicrosoftStoreCovers } from "../utils/microsoftStoreCover";

const AdminComposer = lazy(() =>
  import("../components/admin/AdminComposer").then((module) => ({
    default: module.AdminComposer,
  })),
);

export function AppLayout() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [premiereOpen, setPremiereOpen] = useState(false);
  const [bannerClock, setBannerClock] = useState(() => Date.now());
  const [upcomingStoreCover, setUpcomingStoreCover] = useState(null);
  const premiere = usePremiere();
  const { games: gamesNearRelease = [] } = useGames({ limit: 48 });

  useEffect(() => {
    const timer = window.setInterval(() => setBannerClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const now = bannerClock;
  const monthFromNow = new Date(now);
  const currentDay = monthFromNow.getDate();
  monthFromNow.setDate(1);
  monthFromNow.setMonth(monthFromNow.getMonth() + 1);
  const lastDayOfNextMonth = new Date(
    monthFromNow.getFullYear(),
    monthFromNow.getMonth() + 1,
    0,
  ).getDate();
  monthFromNow.setDate(Math.min(currentDay, lastDayOfNextMonth));
  const nextRelease = gamesNearRelease
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

  useEffect(() => {
    let cancelled = false;
    setUpcomingStoreCover(null);
    if (!nextReleaseGame?.slug) {
      return () => {
        cancelled = true;
      };
    }

    void loadMicrosoftStoreCovers([nextReleaseGame], { includeUnknown: true }).then((covers) => {
      if (cancelled) return;
      setUpcomingStoreCover(
        covers.get(String(nextReleaseGame.id ?? nextReleaseGame.slug)) || null,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [nextReleaseGame]);

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
        coverImage: nextRelease.game.coverImage || nextRelease.game.cover_image || null,
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
    premiere?.state === "upcoming" &&
    Number.isFinite(premiereTimestamp) &&
    premiereTimestamp > now;
  const bannerContent =
    upcomingGameBanner &&
    (!hasFuturePremiere || nextRelease.timestamp < premiereTimestamp)
      ? upcomingGameBanner
      : premiere;

  const location = useLocation();
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
    const canonicalUrl = `https://deadsmilegames.vercel.app${location.pathname || "/"}`;

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

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t("Skip to content")}
      </a>

      <div className={`premiere-shell ${bannerContent && !isAuthPage ? "premiere-shell--with-banner" : ""}`}>
        {bannerContent && !isAuthPage && (
          <PremiereBanner
            premiere={bannerContent}
            onOpen={() => {
              if (bannerContent.kind !== "game") setPremiereOpen(true);
            }}
          />
        )}
        {!isAuthPage && <Header onOpenSearch={() => setSearchOpen(true)} />}
      </div>

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

      {!isAuthPage && <Footer />}

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        hasPremiere={Boolean(bannerContent && !isAuthPage)}
      />

      <VideoOverlay
        videoId={premiereOpen && premiere ? premiere.id : null}
        background={safeImageUrl(premiere?.screenshots?.[0])}
        onClose={() => setPremiereOpen(false)}
      />

      {!isAuthPage && user?.role === "admin" && (
        <Suspense fallback={null}>
          <AdminComposer />
        </Suspense>
      )}

      {!isAuthPage && <CookieConsent />}
    </>
  );
}
