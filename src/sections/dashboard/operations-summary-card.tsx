import { useEffect, useState, useMemo } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

import {
  getHousekeeping,
  getReservationsRange,
  type HousekeepingItem,
  type Reservation,
} from "src/api/client";

type OpsStats = {
  todayCheckIn: number;
  todayCheckOut: number;
  tomorrowCheckIn: number;
  needsCleaning: number;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function OperationsSummaryCard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [housekeeping, setHousekeeping] = useState<HousekeepingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const threeDaysAhead = new Date(today);
        threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

        const iso = (d: Date) => d.toISOString().slice(0, 10);

        const [resv, hk] = await Promise.all([
          getReservationsRange(iso(today), iso(threeDaysAhead)),
          getHousekeeping(),
        ]);

        if (!active) return;

        setReservations(resv);
        setHousekeeping(hk);
      } catch (err) {
        console.error("[OperationsSummaryCard] load error", err);
        if (active) setError("Failed to load operations data");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const stats: OpsStats = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(new Date(Date.now() + 24 * 60 * 60 * 1000));

    let todayCheckIn = 0;
    let todayCheckOut = 0;
    let tomorrowCheckIn = 0;

    reservations.forEach((r) => {
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);

      if (isSameDay(startOfDay(ci), today)) {
        todayCheckIn += 1;
      }
      if (isSameDay(startOfDay(co), today)) {
        todayCheckOut += 1;
      }
      if (isSameDay(startOfDay(ci), tomorrow)) {
        tomorrowCheckIn += 1;
      }
    });

    const needsCleaning = housekeeping.length;

    return { todayCheckIn, todayCheckOut, tomorrowCheckIn, needsCleaning };
  }, [reservations, housekeeping]);

  return (
    <Card>
      <CardHeader
        title="Today and upcoming"
        subheader="Quick overview for operations"
      />

      <Box sx={{ px: 3, pb: 3, pt: 1 }}>
        {loading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ py: 5, minHeight: 220 }}
          >
            <CircularProgress />
          </Stack>
        ) : error ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ py: 5, minHeight: 220 }}
          >
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <SummaryRow
              label="Guests checking in today"
              value={stats.todayCheckIn}
              color="primary"
            />
            <SummaryRow
              label="Guests checking out today"
              value={stats.todayCheckOut}
              color="warning"
            />
            <SummaryRow
              label="Guests checking in tomorrow"
              value={stats.tomorrowCheckIn}
              color="info"
            />
            <SummaryRow
              label="Rooms that need cleaning"
              value={stats.needsCleaning}
              color="error"
            />
          </Stack>
        )}
      </Box>
    </Card>
  );
}

type SummaryRowProps = {
  label: string;
  value: number;
  color:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning";
};

function SummaryRow({ label, value, color }: SummaryRowProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1.5}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Chip
        color={color === "default" ? undefined : color}
        label={value}
        size="small"
      />
    </Stack>
  );
}
