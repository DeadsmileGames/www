
import { Suspense, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion
} from 'motion/react';

import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { SearchOverlay } from '../components/search/SearchOverlay';
import { CookieConsent } from '../components/ui/CookieConsent';
import { AdminComposer } from '../components/admin/AdminComposer';

export function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);

  const location = useLocation();
  const outlet = useOutlet();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setSearchOpen(false);

    if (location.hash) {
      const frame = requestAnimationFrame(() => {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView();
      });

      return () => cancelAnimationFrame(frame);
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const canonicalUrl =
      `https://deadsmilegames.vercel.app${location.pathname || '/'}`;

    const canonical = document.querySelector(
      'link[rel="canonical"]'
    );

    const openGraphUrl = document.querySelector(
      'meta[property="og:url"]'
    );

    canonical?.setAttribute('href', canonicalUrl);
    openGraphUrl?.setAttribute('content', canonicalUrl);
  }, [location.pathname]);

  const isAuthPage = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ].includes(location.pathname);

  // Transição cinematográfica:
  // Fade + Zoom + Blur, sem movimento vertical.

  const pageVariants = {
    initial: {
      opacity: 0,
      scale: reducedMotion ? 1 : 0.97,
      filter: reducedMotion
        ? 'blur(0px)'
        : 'blur(8px)'
    },

    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',

      transition: {
        duration: reducedMotion ? 0.12 : 0.48,
        ease: [0.22, 1, 0.36, 1]
      }
    },

    exit: {
      opacity: 0,
      scale: reducedMotion ? 1 : 1.015,
      filter: reducedMotion
        ? 'blur(0px)'
        : 'blur(5px)',

      transition: {
        duration: reducedMotion ? 0.1 : 0.24,
        ease: [0.4, 0, 1, 1]
      }
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {!isAuthPage &&  (
        <Header
          onOpenSearch={() => setSearchOpen(true)}
        />
      )}

      <main id="main-content">
        <Suspense
          fallback={
            <div
              className="app-loader"
              role="status"
              aria-label="Loading"
            />
          }
        >
          
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            className="page-transition"
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0.01 : 0.2,
              ease: 'easeInOut'
            }}
            style={{
              width: '100%',
              minHeight: '65vh'
            }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>

        </Suspense>
      </main>

      {!isAuthPage && <Footer />}

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {!isAuthPage && <AdminComposer />}

      {!isAuthPage && <CookieConsent />}
    </>
  );
}
