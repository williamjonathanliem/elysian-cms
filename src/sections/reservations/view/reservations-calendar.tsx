import type { Reservation } from "src/api/client";

import { useMemo, useState, useEffect } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { getReservationsRange } from "src/api/client";
import { DashboardContent } from "src/layouts/dashboard";

type Day = { date: Date; key: string; label: string; isToday: boolean };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildDays(from: Date, count: number): Day[] {
  const days: Day[] = [];
  for (let i = 0; i < count; i++) {
    const d = addDays(from, i);
    const isToday = startOfDay(d).getTime() === startOfDay(new Date()).getTime();
    days.push({ date: d, key: fmtISO(d), label: d.getDate().toString(), isToday });
  }
  return days;
}

function dayDiff(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

// simple palette for chips
function statusColor(s: string) {
  if (s === "checked_in") return "#f59e0b";
  if (s === "checked_out") return "#10b981";
  return "#3b82f6";
}

export default function ReservationsCalendar() {
  // visible window, default current month
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [span, setSpan] = useState<number>(31); // days shown
  const [data, setData] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const start = useMemo(() => startOfDay(anchor), [anchor]);
  const end = useMemo(() => addDays(start, span - 1), [start, span]);
  const days = useMemo(() => buildDays(start, span), [start, span]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start.getTime(), end.getTime()]);

  async function load() {
    setLoading(true);
    try {
      const items = await getReservationsRange(fmtISO(start), fmtISO(end));
      setData(items);
    } finally {
      setLoading(false);
    }
  }

  // rooms derived from reservations, grouped
  const rooms = useMemo(() => {
    const map = new Map<number, { id: number; name: string; villa: string }>();
    data.forEach((r) => {
      if (r.room) map.set(r.room.id, { id: r.room.id, name: r.room.name, villa: r.room.villa?.name || "" });
    });
    return Array.from(map.values()).sort(
      (a, b) => a.villa.localeCompare(b.villa) || a.name.localeCompare(b.name),
    );
  }, [data]);

  // reservations by room
  const byRoom = useMemo(() => {
    const m = new Map<number, Reservation[]>();
    data.forEach((r) => {
      const key = r.room?.id;
      if (!key) return;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    });
    m.forEach((list) =>
      list.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()),
    );
    return m;
  }, [data]);

  const monthLabel = useMemo(
    () => start.toLocaleDateString(undefined, { year: "numeric", month: "long" }),
    [start],
  );

  return (
    <DashboardContent maxWidth="xl">
      {/* Header with responsive layout */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 2, md: 0 }}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Reservations calendar</Typography>

        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={1}
          alignItems="center"
          justifyContent={{ xs: "flex-start", md: "flex-end" }}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          <IconButton
            onClick={() =>
              setAnchor(new Date(start.getFullYear(), start.getMonth() - 1, 1))
            }
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>

          <Typography
            variant="subtitle1"
            sx={{ minWidth: 140, textAlign: "center", fontSize: { xs: 14, sm: 16 } }}
          >
            {monthLabel}
          </Typography>

          <IconButton
            onClick={() =>
              setAnchor(new Date(start.getFullYear(), start.getMonth() + 1, 1))
            }
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>

          <Divider flexItem orientation="vertical" sx={{ mx: 1, display: { xs: "none", sm: "block" } }} />

          <Button
            size="small"
            variant={span === 31 ? "contained" : "outlined"}
            onClick={() => setSpan(31)}
            sx={{ minWidth: { xs: 70, sm: 80 }, fontSize: { xs: 11, sm: 13 } }}
          >
            Month
          </Button>
          <Button
            size="small"
            variant={span === 14 ? "contained" : "outlined"}
            onClick={() => setSpan(14)}
            sx={{ minWidth: { xs: 70, sm: 80 }, fontSize: { xs: 11, sm: 13 } }}
          >
            2 weeks
          </Button>
          <Button
            size="small"
            variant={span === 7 ? "contained" : "outlined"}
            onClick={() => setSpan(7)}
            sx={{ minWidth: { xs: 70, sm: 80 }, fontSize: { xs: 11, sm: 13 } }}
          >
            Week
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* Scroll container for narrow screens */}
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Box sx={{ minWidth: 720 }}>
              {/* Header row with days */}
              <Stack
                direction="row"
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  bgcolor: "background.paper",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    width: { xs: 160, sm: 220 },
                    p: 1.5,
                    fontWeight: 600,
                    fontSize: { xs: 12, sm: 14 },
                  }}
                >
                  Room
                </Box>
                <Stack direction="row" sx={{ flex: 1 }}>
                  {days.map((d) => (
                    <Box
                      key={d.key}
                      sx={{
                        flex: 1,
                        p: 1,
                        textAlign: "center",
                        fontSize: { xs: 10, sm: 12 },
                        bgcolor: d.isToday ? "action.hover" : "transparent",
                        borderLeft: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {d.label}
                    </Box>
                  ))}
                </Stack>
              </Stack>

              {/* Rows */}
              <Box sx={{ position: "relative" }}>
                {rooms.map((room) => (
                  <Stack
                    key={room.id}
                    direction="row"
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      minHeight: 44,
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 160, sm: 220 },
                        p: 1.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: { xs: 11, sm: 13 } }}
                      >
                        {room.villa}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: 11, sm: 13 } }}
                      >
                        {room.name}
                      </Typography>
                    </Box>

                    <Stack direction="row" sx={{ flex: 1, position: "relative" }}>
                      {/* vertical day guides */}
                      {days.map((d) => (
                        <Box
                          key={room.id + d.key}
                          sx={{ flex: 1, borderLeft: "1px solid", borderColor: "divider" }}
                        />
                      ))}

                      {/* reservations bars */}
                      {byRoom.get(room.id)?.map((r, ridx) => {
                        const ci = startOfDay(new Date(r.checkIn));
                        const co = startOfDay(new Date(r.checkOut));
                        const leftCols = Math.max(0, dayDiff(start, ci));
                        const widthCols = Math.max(1, dayDiff(ci, addDays(co, 0)));
                        const color = statusColor(r.status);
                        const title = `${r.guestName} , ${room.villa} , ${room.name} , ${new Date(
                          r.checkIn,
                        ).toLocaleDateString()} → ${new Date(
                          r.checkOut,
                        ).toLocaleDateString()}`;

                        return (
                          <Box
                            key={`${room.id}-${r.id}-${ridx}`}
                            title={title}
                            sx={{
                              position: "absolute",
                              left: `calc(${leftCols} * (100% / ${span}))`,
                              top: 8,
                              width: `calc(${widthCols} * (100% / ${span}))`,
                              height: 28,
                              bgcolor: color,
                              color: "#fff",
                              borderRadius: 1,
                              px: 1,
                              display: "flex",
                              alignItems: "center",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              fontSize: 12,
                            }}
                          >
                            {r.guestName} {r.numGuests ? `(${r.numGuests})` : ""}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Stack>
                ))}

                {rooms.length === 0 && !loading && (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No reservations in this range.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
