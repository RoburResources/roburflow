import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Guards a group of routes so only admins can access them.
// Drivers hitting an admin URL directly are redirected to their home.
export default function RoleRoute({ adminOnly = true }) {
  const { loading, isAdmin } = useCurrentUser();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-robur-gold/30 border-t-robur-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}