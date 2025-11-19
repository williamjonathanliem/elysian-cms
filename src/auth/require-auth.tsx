// src/auth/require-auth.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  console.log("[RequireAuth] render", {
    pathname: location.pathname,
    loading,
    user,
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    console.log("[RequireAuth] no user, redirect to /auth/sign-in");
    return <Navigate to="/auth/sign-in" replace state={{ from: location }} />;
  }

  console.log("[RequireAuth] user present, render children");
  return <>{children}</>;
}
