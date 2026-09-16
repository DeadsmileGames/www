import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './app/AppLayout';
import { ProtectedRoute } from './app/ProtectedRoute';

const page = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));
const Home = page(() => import('./pages/Home'), 'Home');
const Games = page(() => import('./pages/Games'), 'Games');
const GameDetails = page(() => import('./pages/GameDetails'), 'GameDetails');
const Search = page(() => import('./pages/Search'), 'Search');
const Login = page(() => import('./pages/Login'), 'Login');
const Register = page(() => import('./pages/Register'), 'Register');
const Account = page(() => import('./pages/Account'), 'Account');
const Privacy = page(() => import('./pages/Privacy'), 'Privacy');
const Terms = page(() => import('./pages/Terms'), 'Terms');
const Studio = page(() => import('./pages/Studio'), 'Studio');
const News = page(() => import('./pages/News'), 'News');
const Wishlist = page(() => import('./pages/Wishlist'), 'Wishlist');
const Videos = page(() => import('./pages/Videos'), 'Videos');
const Downloads = page(() => import('./pages/Downloads'), 'Downloads');
const Store = page(() => import('./pages/Store'), 'Store');
const Support = page(() => import('./pages/Support'), 'Support');
const PressKit = page(() => import('./pages/PressKit'), 'PressKit');
const NotFound = page(() => import('./pages/NotFound'), 'NotFound');
const Status = page(() => import('./pages/Status'), 'Status');
const PublicProfile = page(() => import('./pages/PublicProfile'), 'PublicProfile');
const ForgotPassword = page(() => import('./pages/ForgotPassword'), 'ForgotPassword');
const ResetPassword = page(() => import('./pages/ResetPassword'), 'ResetPassword');
const AppDownload = page(() => import('./pages/AppDownload'), 'AppDownload');
const AdminPlatform = page(() => import('./pages/AdminPlatform'), 'AdminPlatform');
const NewsletterAction = page(() => import('./pages/NewsletterAction'), 'NewsletterAction');

export default function App() {
  return <Suspense fallback={<div className="app-loader" aria-label="Loading" />}><Routes><Route element={<AppLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/presskit" element={<PressKit />} />
    <Route path="/games" element={<Games />} />
    <Route path="/games/:slug" element={<GameDetails />} />
    <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
    <Route path="/news" element={<News />} />
    <Route path="/news/:slug" element={<News />} />
    <Route path="/videos" element={<Videos />} />
    <Route path="/videos/:id" element={<Videos />} />
    <Route path="/downloads" element={<Downloads />} />
    <Route path="/store" element={<Store />} />
    <Route path="/downloads/app/:platform" element={<AppDownload />} />
    <Route path="/support" element={<Support />} />
    <Route path="/studio" element={<Studio />} />
    <Route path="/search" element={<Search />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/status" element={<Status />} />
    <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
    <Route path="/admin/platform" element={<ProtectedRoute role="admin"><AdminPlatform /></ProtectedRoute>} />
    <Route path="/profile/:username" element={<PublicProfile />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/newsletter/confirm" element={<NewsletterAction action="confirm" />} />
    <Route path="/newsletter/unsubscribe" element={<NewsletterAction action="unsubscribe" />} />
    <Route path="*" element={<NotFound />} />
  </Route></Routes></Suspense>;
}
