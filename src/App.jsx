
import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion
} from 'motion/react';

import { AppLayout } from './app/AppLayout';
import { ProtectedRoute } from './app/ProtectedRoute';

const page = (loader, name) =>
  lazy(() =>
    loader().then((module) => ({
      default: module[name]
    }))
  );

const Home = page(() => import('./pages/Home'), 'Home');
const Games = page(() => import('./pages/Games'), 'Games');
const GameDetails = page(() => import('./pages/GameDetails'), 'GameDetails');
const Search = page(() => import('./pages/Search'), 'Search');
const Login = page(() => import('./pages/Login'), 'Login');
const Register = page(() => import('./pages/Register'), 'Register');
const Account = page(() => import('./pages/Account'), 'Account');
const Privacy = page(() => import('./pages/Privacy'), 'Privacy');
const Terms = page(() => import('./pages/Terms'), 'Terms');
const About = page(() => import('./pages/About'), 'About');
const News = page(() => import('./pages/News'), 'News');
const Wishlist = page(() => import('./pages/Wishlist'), 'Wishlist');
const Store = page(() => import('./pages/Store'), 'Store');
const Support = page(() => import('./pages/Support'), 'Support');
const PressKit = page(() => import('./pages/PressKit'), 'PressKit');
const NotFound = page(() => import('./pages/NotFound'), 'NotFound');
const PublicProfile = page(() => import('./pages/PublicProfile'), 'PublicProfile');
const ForgotPassword = page(() => import('./pages/ForgotPassword'), 'ForgotPassword');
const ResetPassword = page(() => import('./pages/ResetPassword'), 'ResetPassword');
const NewsletterAction = page(() => import('./pages/NewsletterAction'), 'NewsletterAction');

// Animação de entrada e saída das páginas
function PageTransition({ children }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: reducedMotion ? 0 : 18
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: reducedMotion ? 0 : -12
      }}
      transition={{
        duration: reducedMotion ? 0.01 : 0.3,
        ease: [0.22, 1, 0.36, 1]
      }}
      style={{
        width: '100%',
        minHeight: '65vh'
      }}
    >
      {children}
    </motion.div>
  );
}

// Componente responsável por animar a troca de rotas
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<PageTransition><Home /></PageTransition>}
          />

          <Route
            path="/privacy"
            element={<PageTransition><Privacy /></PageTransition>}
          />

          <Route
            path="/terms"
            element={<PageTransition><Terms /></PageTransition>}
          />

          <Route
            path="/presskit"
            element={<PageTransition><PressKit /></PageTransition>}
          />

          <Route
            path="/games"
            element={<PageTransition><Games /></PageTransition>}
          />

          <Route
            path="/games/:slug"
            element={<PageTransition><GameDetails /></PageTransition>}
          />

          <Route
            path="/wishlist"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/news"
            element={<PageTransition><News /></PageTransition>}
          />

          <Route
            path="/news/:slug"
            element={<PageTransition><News /></PageTransition>}
          />

          <Route
            path="/support"
            element={<PageTransition><Support /></PageTransition>}
          />

          <Route
            path="/about"
            element={<PageTransition><About /></PageTransition>}
          />

          <Route
            path="/search"
            element={<PageTransition><Search /></PageTransition>}
          />

          <Route
            path="/login"
            element={<PageTransition><Login /></PageTransition>}
          />

          <Route
            path="/register"
            element={<PageTransition><Register /></PageTransition>}
          />

          <Route
            path="/account"
            element={
              <PageTransition>
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              </PageTransition>
            }
          />

          <Route
            path="/profile/:username"
            element={<PageTransition><PublicProfile /></PageTransition>}
          />

          <Route
            path="/forgot-password"
            element={<PageTransition><ForgotPassword /></PageTransition>}
          />

          <Route
            path="/reset-password"
            element={<PageTransition><ResetPassword /></PageTransition>}
          />

          <Route
            path="/newsletter/confirm"
            element={
              <PageTransition>
                <NewsletterAction action="confirm" />
              </PageTransition>
            }
          />

          <Route
            path="/newsletter/unsubscribe"
            element={
              <PageTransition>
                <NewsletterAction action="unsubscribe" />
              </PageTransition>
            }
          />

          <Route
            path="*"
            element={<PageTransition><NotFound /></PageTransition>}
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div
          className="app-loader"
          aria-label="Loading"
        />
      }
    >
      <AnimatedRoutes />
    </Suspense>
  );
}
