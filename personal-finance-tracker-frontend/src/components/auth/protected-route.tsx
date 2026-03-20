import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { routes } from "@/utils/routes";

export function ProtectedRoute() {
  const session = useAuthStore((state) => state.session);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const location = useLocation();

  if (!hasHydrated) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!session) {
    return <Navigate to={routes.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
