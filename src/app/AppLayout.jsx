import { useLanguage } from "../context/LanguageContext";
import { SkeletonPage } from "../components/ui/Skeleton";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

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

      <div className={`premiere-shell ${premiere && !isAuthPage ? "premiere-shell--with-banner" : ""}`}>
        {premiere && !isAuthPage && (
          <PremiereBanner premiere={premiere} onOpen={() => setPremiereOpen(true)} />
        )}
        {!isAuthPage && <Header onOpenSearch={() => setSearchOpen(true)} />}
      </div>

      <main id="main-content">
        <Suspense fallback={<SkeletonPage path={location.pathname} />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
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
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      {!isAuthPage && <Footer />}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

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
