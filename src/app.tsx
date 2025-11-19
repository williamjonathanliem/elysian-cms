// src/app.tsx
import "src/global.css";

import React, { useEffect } from "react";
import { varAlpha } from "minimal-shared/utils";
import { BrowserRouter } from "react-router-dom";

import Box from "@mui/material/Box";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";

import { usePathname } from "src/routes/hooks";

import Router from "src/routes";
import { ThemeProvider } from "src/theme/theme-provider";

import { AuthProvider } from "src/auth/AuthProvider";

console.log("[App] module loaded");

// simple fallback used while lazy routes are loading
function LoadingFallback() {
  console.log("[App] LoadingFallback render");
  return (
    <Box
      sx={{
        display: "flex",
        flex: "1 1 auto",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <LinearProgress
        sx={{
          width: 1,
          maxWidth: 320,
          bgcolor: (theme) =>
            varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
          [`& .${linearProgressClasses.bar}`]: { bgcolor: "text.primary" },
        }}
      />
    </Box>
  );
}

// scroll to top on route change
function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    console.log("[App] scroll to top for path", pathname);
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  console.log("[App] render");

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <React.Suspense fallback={<LoadingFallback />}>
            <Router />
          </React.Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
