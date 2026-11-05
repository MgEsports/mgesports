import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { ShieldAlert, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 text-[#FFBE32] animate-spin mb-4" />
        <span className="font-heading text-xs uppercase tracking-widest text-gray-400">
          Verifying Admin Credentials...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (user && user.role === "PLAYER") {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl uppercase tracking-wider text-white">
          Access Restricted
        </h2>
        <p className="mt-2 text-sm text-gray-400 max-w-md">
          Player accounts cannot access the administrative portal. Please log in with an authorized Admin account.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
