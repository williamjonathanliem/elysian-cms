// src/sections/overview/view/overview-analytics-view.tsx
import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { DashboardContent } from "src/layouts/dashboard";
import { getDashboard, getHousekeeping } from "src/api/client";

import { Iconify } from "src/components/iconify";

import CleaningSummary from "src/sections/dashboard/cleaning-summary";

import { AnalyticsCurrentVisits } from "../analytics-current-visits";
import { AnalyticsWidgetSummary } from "../analytics-widget-summary";

// ----------------------------------------------------------------------

type TodoItem = {
  id: number;
  title: string;
  done: boolean;
};

// Simple Tasks Card, add, toggle, delete
function DashboardTasksCard() {
  const [items, setItems] = useState<TodoItem[]>([
    { id: 1, title: "Review today's check in list", done: false },
    { id: 2, title: "Check rooms that require cleaning", done: false },
    { id: 3, title: "Confirm tomorrow reservations", done: false },
  ]);

  const [input, setInput] = useState("");

  function handleAdd() {
    const title = input.trim();
    if (!title) return;
    setItems((prev) => [...prev, { id: Date.now(), title, done: false }]);
    setInput("");
  }

  function handleToggle(id: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );
  }

  function handleDelete(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <Card>
      <CardHeader title="Tasks" subheader="Manage your daily to do list" />
      <CardContent>
        <Stack spacing={2}>
          {/* Add task */}
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add a new task..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <Button variant="contained" size="small" onClick={handleAdd}>
              Add
            </Button>
          </Stack>

          {/* Task list */}
          <List sx={{ maxHeight: 260, overflow: "auto" }}>
            {items.length === 0 && (
              <ListItem>
                <ListItemText primary="No tasks yet. Add one above." />
              </ListItem>
            )}

            {items.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <IconButton onClick={() => handleDelete(item.id)}>
                    <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                  </IconButton>
                }
              >
                <Checkbox
                  checked={item.done}
                  onChange={() => handleToggle(item.id)}
                  sx={{ mr: 1 }}
                />
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    sx: item.done
                      ? {
                          textDecoration: "line-through",
                          color: "text.disabled",
                        }
                      : undefined,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [totalRooms, setTotalRooms] = useState(0);
  const [occupiedRooms, setOccupiedRooms] = useState(0);
  const [stayingToday, setStayingToday] = useState(0);
  const [toClean, setToClean] = useState(0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [dash, hk] = await Promise.all([getDashboard(), getHousekeeping()]);

      setTotalRooms(dash.totalRooms || 0);
      setOccupiedRooms(dash.occupiedRooms || 0);
      setStayingToday((dash.reservationsToday || []).length);

      // count only rooms that really need cleaning
      const needsCleaningStatuses = ["recently_checked_out", "maintenance"];

      const toCleanCount = (hk || []).filter((item) =>
        needsCleaningStatuses.includes(item.status),
      ).length;

      setToClean(toCleanCount);
    } catch {
      // optional snackbar later
    }
  }

  const kpiCategories = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
    [],
  );

  const roomStatusSeries = useMemo(() => {
    const approxAvailable = Math.max(totalRooms - occupiedRooms - toClean, 0);
    return [
      { label: "Occupied", value: occupiedRooms },
      { label: "Staying today", value: stayingToday },
      { label: "Needs cleaning", value: toClean },
      { label: "Available (approx.)", value: approxAvailable },
    ];
  }, [totalRooms, occupiedRooms, stayingToday, toClean]);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        {/* KPI cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total rooms"
            percent={0}
            total={totalRooms}
            icon={
              <img
                alt="Total rooms"
                src="/assets/icons/glass/ic-glass-bag.svg"
              />
            }
            chart={{
              categories: kpiCategories,
              series: [12, 18, 21, 27, 22, 19, 25, 24],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Occupied now"
            percent={0}
            total={occupiedRooms}
            color="secondary"
            icon={
              <img
                alt="Occupied"
                src="/assets/icons/glass/ic-glass-users.svg"
              />
            }
            chart={{
              categories: kpiCategories,
              series: [8, 7, 12, 15, 11, 13, 14, 12],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Staying today"
            percent={0}
            total={stayingToday}
            color="warning"
            icon={
              <img
                alt="Staying today"
                src="/assets/icons/glass/ic-glass-buy.svg"
              />
            }
            chart={{
              categories: kpiCategories,
              series: [2, 3, 4, 3, 5, 6, 5, 4],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Needs cleaning"
            percent={0}
            total={toClean}
            color="error"
            icon={
              <img
                alt="Needs cleaning"
                src="/assets/icons/glass/ic-glass-message.svg"
              />
            }
            chart={{
              categories: kpiCategories,
              series: [1, 1, 2, 1, 3, 2, 4, 2],
            }}
          />
        </Grid>

        {/* Cleaning summary */}
        <Grid size={{ xs: 12 }}>
          <CleaningSummary />
        </Grid>

        {/* Room status chart, reusing your AnalyticsCurrentVisits */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentVisits
            title="Room status"
            chart={{ series: roomStatusSeries }}
          />
        </Grid>

        {/* Tasks card with add and delete */}
        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <DashboardTasksCard />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
