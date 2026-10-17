import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonPage } from "../components/ui/Skeleton";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, role }) {
  const { status, user, error, refresh } = useAuth();
  const location = useLocation();

  if (status === "loading") return <SkeletonPage path={location.pathname} />;

  if (status === "error")
    return (
      <div className="account-page container">
        <ErrorState message={error} onRetry={refresh} />
      </div>
    );

  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/account" replace />;
  }

  return children;
}
