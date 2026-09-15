import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { SearchOverlay } from '../components/search/SearchOverlay';
import './AppLayout.css';
import { CookieConsent } from '../components/ui/CookieConsent';
import { AdminComposer } from '../components/admin/AdminComposer';

export function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const id = window.setTimeout(() => setLoading(false), 420); return () => window.clearTimeout(id); }, []);
  const location = useLocation();
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
    {loading && <div className="app-loader" aria-hidden="true"></div>}
    <a href="#main-content" className="skip-link">Skip to content</a>
    {!isAuthPage && <Header onOpenSearch={() => setSearchOpen(true)} />}
    <main id="main-content"><Outlet /></main>
    {!isAuthPage && <Footer />}
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    {!isAuthPage && <AdminComposer />}
    {!isAuthPage && <CookieConsent />}
  </>;
}
