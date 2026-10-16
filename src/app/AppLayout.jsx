import { useLanguage } from "../context/LanguageContext";
import { useGames } from "../hooks/useGames";
import { SkeletonPage } from "../components/ui/Skeleton";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
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
  const premiere = usePremiere();
  const { games: gamesNearRelease = [] } = useGames({ limit: 48, status: "in_development" });
  const now = Date.now();
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
      const timestamp =
        typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? new Date(`${value}T00:00:00-03:00`).getTime()
          : Date.parse(value || "");
      return { game, timestamp };
    })
    .filter(
      (item) =>
        Number.isFinite(item.timestamp) &&
        item.timestamp > now &&
        item.timestamp <= monthFromNow.getTime(),
    )
    .sort((a, b) => a.timestamp - b.timestamp)[0] || null;
  const upcomingGameBanner = nextRelease
    ? {
        kind: "game",
        state: "upcoming",
        title: nextRelease.game.title,
        starts_at: new Date(nextRelease.timestamp).toISOString(),
        slug: nextRelease.game.slug,
        thumbnail:
          nextRelease.game.coverImage ||
          nextRelease.game.cover_image ||
          nextRelease.game.heroImage ||
          nextRelease.game.hero_image ||
          null,
        screenshots: [
          nextRelease.game.heroImage || nextRelease.game.hero_image,
          nextRelease.game.coverImage || nextRelease.game.cover_image,
        ].filter(Boolean),
      }
    : null;
  const premiereTimestamp = Date.parse(premiere?.starts_at || "");
  const bannerContent =
    upcomingGameBanner &&
    (premiere?.state !== "upcoming" ||
      !Number.isFinite(premiereTimestamp) ||
      nextRelease.timestamp < premiereTimestamp)
      ? upcomingGameBanner
      : premiere;

  const location = useLocation();
  const navigate = useNavigate();
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
              if (bannerContent.kind === "game" && bannerContent.slug) {
                navigate(`/games/${encodeURIComponent(bannerContent.slug)}`);
              } else if (bannerContent.kind !== "game") {
                setPremiereOpen(true);
              }
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
        hasPremiere={Boolean(premiere && !isAuthPage)}
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
