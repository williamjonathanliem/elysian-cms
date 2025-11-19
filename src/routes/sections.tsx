import type { RouteObject } from "react-router";

import { lazy, Suspense } from "react";
import { varAlpha } from "minimal-shared/utils";
import { Navigate, Outlet } from "react-router-dom";

import Box from "@mui/material/Box";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";

import { AuthLayout } from "src/layouts/auth";
import { DashboardLayout } from "src/layouts/dashboard";

import PublicOnly from "src/auth/public-only";
import RequireAuth from "src/auth/require-auth";

// ----------------------------------------------------------------------
// Lazy pages
const DashboardPage = lazy(() => import("src/pages/dashboard"));
const Page404 = lazy(() => import("src/pages/page-not-found"));
const RoomsPage = lazy(() => import("src/pages/rooms"));
const ReservationsPage = lazy(() => import("src/pages/reservations"));
const ReservationCreatePage = lazy(
  () => import("src/pages/reservation-new"),
);
const RoomCreatePage = lazy(() => import("src/pages/room-new"));
const ReservationsCalendarPage = lazy(
  () => import("src/pages/reservations-calendar"),
);
const SignInPage = lazy(() => import("src/pages/auth/sign-in"));
const AccountsPage = lazy(() => import("src/pages/account"));

const renderFallback = () => (
  <Box
    sx={{
      display: "flex",
      flex: "1 1 auto",
      alignItems: "center",
      justifyContent: "center",
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

// ----------------------------------------------------------------------

export const routesSection: RouteObject[] = [
  // protected app
  {
    element: (
      <RequireAuth>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "rooms", element: <RoomsPage /> },
      { path: "rooms/new", element: <RoomCreatePage /> },
      { path: "reservations", element: <ReservationsPage /> },
      { path: "reservations/new", element: <ReservationCreatePage /> },
      {
        path: "reservations/calendar",
        element: <ReservationsCalendarPage />,
      },

      // accounts management page
      { path: "account", element: <AccountsPage /> },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  // auth routes full path /auth/sign-in
  {
    path: "auth",
    element: (
      <PublicOnly>
        <AuthLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </AuthLayout>
      </PublicOnly>
    ),
    children: [{ path: "sign-in", element: <SignInPage /> }],
  },

  // not found
  { path: "404", element: <Page404 /> },
  { path: "*", element: <Navigate to="/404" replace /> },
];
