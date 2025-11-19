// src/auth/public-only.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./AuthProvider";

export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  console.log("[PublicOnly] render", {
    pathname: location.pathname,
    loading,
    user,
  });

  if (loading) {
    // allow the auth layout to show its own skeleton or nothing
    return <>{children}</>;
  }

  if (user) {
    console.log("[PublicOnly] user already logged in, redirect to /");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
