import { lazy, useMemo } from "react";
import { Navigate, useLocation, useParams, useRoutes } from "react-router-dom";
import { AppLayout } from "./app/AppLayout";
import { ProtectedRoute } from "./app/ProtectedRoute";

const page = (loader, name) =>
  lazy(() => loader().then((module) => ({ default: module[name] })));
const Home = page(() => import("./pages/Home"), "Home");
const Launcher = page(() => import("./pages/Launcher"), "Launcher");
const Games = page(() => import("./pages/Games"), "Games");
const GameDetails = page(() => import("./pages/GameDetails"), "GameDetails");
const Preorder = page(() => import("./pages/Preorder"), "Preorder");
const PreorderConfirm = page(() => import("./pages/Preorder"), "PreorderConfirm");
const PreorderReward = page(() => import("./pages/Preorder"), "PreorderReward");
const GameLatest = page(() => import("./pages/GameLatest"), "GameLatest");
const Search = page(() => import("./pages/Search"), "Search");
const Login = page(() => import("./pages/Login"), "Login");
const Register = page(() => import("./pages/Register"), "Register");
const VerifyEmail = page(() => import("./pages/VerifyEmail"), "VerifyEmail");
const Account = page(() => import("./pages/Account"), "Account");
const AdminPanel = page(() => import("./components/admin/AdminComposer"), "AdminComposer");
const Privacy = page(() => import("./pages/Privacy"), "Privacy");
const Terms = page(() => import("./pages/Terms"), "Terms");
const About = page(() => import("./pages/About"), "About");
const News = page(() => import("./pages/News"), "News");
const Videos = page(() => import("./pages/Videos"), "Videos");
const Soundtracks = page(() => import("./pages/Soundtracks"), "Soundtracks");
const Wishlist = page(() => import("./pages/Wishlist"), "Wishlist");
const Library = page(() => import("./pages/Library"), "Library");
const Support = page(() => import("./pages/Support"), "Support");
const PressKit = page(() => import("./pages/PressKit"), "PressKit");
const NotFound = page(() => import("./pages/NotFound"), "NotFound");
const PublicProfile = page(() => import("./pages/PublicProfile"), "PublicProfile");
const SpecialThanks = page(() => import("./pages/SpecialThanks"), "SpecialThanks");
const ForgotPassword = page(() => import("./pages/ForgotPassword"), "ForgotPassword");
const ResetPassword = page(() => import("./pages/ResetPassword"), "ResetPassword");
const NewsletterAction = page(() => import("./pages/NewsletterAction"), "NewsletterAction");

function LegacyNews({ windows95Mode }) {
  const { slug } = useParams();
  const prefix = windows95Mode ? "/1995" : "";
  return (
    <Navigate
      replace
      to={slug
        ? `${prefix}/newswire/${encodeURIComponent(slug)}`
        : `${prefix}/newswire`}
    />
  );
}

function PreorderRegisterRedirect({ windows95Mode }) {
  const { slug } = useParams();
  const prefix = windows95Mode ? "/1995" : "";
  return <Navigate replace to={`${prefix}/games/${encodeURIComponent(slug)}/preorder`} />;
}

function createAppRoutes(windows95Mode) {
  return [
    {
      element: <AppLayout windows95Mode={windows95Mode} />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/privacy", element: <Privacy /> },
        { path: "/terms", element: <Terms /> },
        { path: "/presskit", element: <PressKit /> },
        { path: "/games", element: <Games /> },
        { path: "/games/:slug/latest", element: <GameLatest /> },
        { path: "/games/:slug/preorder/confirm/:token", element: <PreorderConfirm /> },
        {
          path: "/games/:slug/preorder/reward/:token",
          element: <ProtectedRoute><PreorderReward /></ProtectedRoute>,
        },
        {
          path: "/games/:slug/preorder/reward",
          element: <ProtectedRoute><PreorderReward /></ProtectedRoute>,
        },
        {
          path: "/games/:slug/preorder/register",
          element: <PreorderRegisterRedirect windows95Mode={windows95Mode} />,
        },
        { path: "/games/:slug/preorder", element: <Preorder /> },
        { path: "/launcher", element: <Launcher /> },
        { path: "/videos", element: <Videos /> },
        { path: "/soundtracks", element: <Soundtracks /> },
        { path: "/games/:slug", element: <GameDetails /> },
        { path: "/wishlist", element: <ProtectedRoute><Wishlist /></ProtectedRoute> },
        { path: "/library", element: <ProtectedRoute><Library /></ProtectedRoute> },
        { path: "/news", element: <LegacyNews windows95Mode={windows95Mode} /> },
        { path: "/news/:slug", element: <LegacyNews windows95Mode={windows95Mode} /> },
        { path: "/newswire", element: <News /> },
        { path: "/newswire/:slug", element: <News /> },
        { path: "/support", element: <Support /> },
        { path: "/about", element: <About /> },
        { path: "/specialthanks", element: <SpecialThanks /> },
        { path: "/search", element: <Search /> },
        { path: "/login", element: <Login /> },
        { path: "/register", element: <Register /> },
        { path: "/verify-email", element: <VerifyEmail /> },
        { path: "/account", element: <ProtectedRoute><Account /></ProtectedRoute> },
        { path: "/admin", element: <ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute> },
        { path: "/profile/:username", element: <PublicProfile /> },
        { path: "/forgot-password", element: <ForgotPassword /> },
        { path: "/reset-password", element: <ResetPassword /> },
        { path: "/newsletter/confirm", element: <NewsletterAction action="confirm" /> },
        { path: "/newsletter/unsubscribe", element: <NewsletterAction action="unsubscribe" /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ];
}

export default function App() {
  const location = useLocation();
  const windows95Mode = /^\/1995(?:\/|$)/.test(location.pathname);
  const routeLocation = windows95Mode
    ? { ...location, pathname: location.pathname.replace(/^\/1995(?=\/|$)/, "") || "/" }
    : undefined;
  const routes = useMemo(() => createAppRoutes(windows95Mode), [windows95Mode]);

  return useRoutes(routes, routeLocation);
}
