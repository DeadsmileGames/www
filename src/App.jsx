import { lazy } from "react";
import { Navigate, useParams, Routes, Route } from "react-router-dom";
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
const ForgotPassword = page(() => import("./pages/ForgotPassword"), "ForgotPassword");
const ResetPassword = page(() => import("./pages/ResetPassword"), "ResetPassword");
const NewsletterAction = page(
  () => import("./pages/NewsletterAction"),
  "NewsletterAction",
);
function LegacyNews() {
  const { slug } = useParams();
  return (
    <Navigate replace to={slug ? `/newswire/${encodeURIComponent(slug)}` : "/newswire"} />
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/presskit" element={<PressKit />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:slug/latest" element={<GameLatest />} />
        <Route path="/games/:slug/preorder/confirm/:token" element={<PreorderConfirm />} />
        <Route path="/games/:slug/preorder/reward/:token" element={<PreorderReward />} />
        <Route path="/games/:slug/preorder" element={<Preorder />} />
        <Route path="/launcher" element={<Launcher />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/soundtracks" element={<Soundtracks />} />
        <Route path="/games/:slug" element={<GameDetails />} />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />
        <Route path="/news" element={<LegacyNews />} />
        <Route path="/news/:slug" element={<LegacyNews />} />
        <Route path="/newswire" element={<News />} />
        <Route path="/newswire/:slug" element={<News />} />
        <Route path="/support" element={<Support />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route path="/profile/:username" element={<PublicProfile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/newsletter/confirm"
          element={<NewsletterAction action="confirm" />}
        />
        <Route
          path="/newsletter/unsubscribe"
          element={<NewsletterAction action="unsubscribe" />}
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
