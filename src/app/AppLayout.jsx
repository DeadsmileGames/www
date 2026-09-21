import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { SearchOverlay } from '../components/search/SearchOverlay';
import { CookieConsent } from '../components/ui/CookieConsent';
import { AdminComposer } from '../components/admin/AdminComposer';

export function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setSearchOpen(false);
    if (location.hash) {
      const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    const canonicalUrl = `https://deadsmilegames.vercel.app${location.pathname || '/'}`;
    const canonical = document.querySelector('link[rel="canonical"]');
    const openGraphUrl = document.querySelector('meta[property="og:url"]');
    canonical?.setAttribute('href', canonicalUrl);
    openGraphUrl?.setAttribute('content', canonicalUrl);
  }, [location.pathname]);
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(
  location.pathname,
);
  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    {!isAuthPage && <Header onOpenSearch={() => setSearchOpen(true)} />}
    <main id="main-content"><Outlet /></main>
    {!isAuthPage && <Footer />}
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    {!isAuthPage && <AdminComposer />}
    {!isAuthPage && <CookieConsent />}
  </>;
}
