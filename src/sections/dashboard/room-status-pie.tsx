import { useEffect, useState, useMemo } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
  } from "recharts";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

import { getRooms, type Room } from "src/api/client";

type PieItem = {
  name: string;
  value: number;
};

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  checked_in: "Checked in",
  checked_out: "Checked out",
};

const COLORS = ["#3B82F6", "#22C55E", "#F97316", "#94A3B8"];

export function RoomStatusPie() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getRooms();
        if (active) {
          setRooms(data);
        }
      } catch (err) {
        console.error("[RoomStatusPie] failed to load rooms", err);
        if (active) setError("Failed to load room data");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const { chartData, totalRooms } = useMemo(() => {
    if (!rooms.length) return { chartData: [] as PieItem[], totalRooms: 0 };

    const counts: Record<string, number> = {};
    rooms.forEach((r) => {
      const s = r.status || "available";
      counts[s] = (counts[s] || 0) + 1;
    });

    const items: PieItem[] = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, value]) => ({
        name: STATUS_LABEL[status] || status,
        value,
      }));

    const total = rooms.length;

    return { chartData: items, totalRooms: total };
  }, [rooms]);

  return (
    <Card>
      <CardHeader
        title="Current visits"
        subheader={
          totalRooms
            ? `${totalRooms} rooms are in the system`
            : "No rooms found"
        }
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
        ) : !chartData.length ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ py: 5, minHeight: 220 }}
          >
            <Typography variant="body2" color="text.secondary">
              No room data to display
            </Typography>
          </Stack>
        ) : (
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={chartData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </Card>
  );
}
