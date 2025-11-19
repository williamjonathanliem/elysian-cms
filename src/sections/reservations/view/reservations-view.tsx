// src/sections/reservations/view/reservations-view.tsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { DashboardContent } from "src/layouts/dashboard";
import {
  getReservations,
  checkInReservation,
  checkOutReservation,
  markRoomClean,
  type Reservation,
} from "src/api/client";

import ExportReservationsButton from "src/components/export/export-reservations-button";

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

type ResStatusGroup = "checked_in" | "booked" | "checked_out";

const RES_GROUP_ORDER: ResStatusGroup[] = ["checked_in", "booked", "checked_out"];

const RES_GROUP_LABEL: Record<ResStatusGroup, string> = {
  checked_in: "Guests currently staying",
  booked: "Upcoming bookings",
  checked_out: "Past stays",
};

export function ReservationsView() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity?: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    setLoading(true);
    try {
      const data = await getReservations();
      setReservations(data);
    } finally {
      setLoading(false);
    }
  }

  function groupedReservations() {
    const groups: Partial<Record<ResStatusGroup, Reservation[]>> = {};
    reservations.forEach((r) => {
      const status = (r.status || "booked") as ResStatusGroup;
      if (!groups[status]) groups[status] = [];
      groups[status]!.push(r);
    });
    return groups;
  }

  async function handleCheckIn(id: number) {
    setActionId(id);
    try {
      const updated = await checkInReservation(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: updated.status } : r)),
      );
      setSnackbar({ open: true, message: "Checked in", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to check in", severity: "error" });
    } finally {
      setActionId(null);
    }
  }

  async function handleCheckOut(id: number) {
    setActionId(id);
    try {
      const updated = await checkOutReservation(id);
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: updated.status,
                room: r.room ? { ...r.room, status: "checked_out" } : r.room,
              }
            : r,
        ),
      );
      setSnackbar({ open: true, message: "Checked out", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to check out", severity: "error" });
    } finally {
      setActionId(null);
    }
  }

  async function handleClean(roomId: number) {
    setActionId(roomId);
    try {
      const updatedRoom = await markRoomClean(roomId);
      setReservations((prev) =>
        prev.map((r) =>
          r.room && r.room.id === updatedRoom.id ? { ...r, room: { ...r.room, status: updatedRoom.status } } : r,
        ),
      );
      setSnackbar({ open: true, message: "Marked as cleaned", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to mark as cleaned", severity: "error" });
    } finally {
      setActionId(null);
    }
  }

  const groups = groupedReservations();

  return (
    <DashboardContent maxWidth="lg">
      {/* Responsive header and buttons */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 2, sm: 0 }}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">Reservations</Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Button
            variant="contained"
            component={RouterLink}
            to="/reservations/new"
            size="small"
            fullWidth
          >
            Add reservation
          </Button>

          <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
            <ExportReservationsButton rows={reservations} />
          </Box>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Stack spacing={4}>
              {RES_GROUP_ORDER.map((key) => {
                const list = groups[key];
                if (!list || list.length === 0) return null;

                return (
                  <Stack key={key} spacing={1}>
                    <Typography variant="subtitle1" sx={{ px: 1 }}>
                      {RES_GROUP_LABEL[key]} [{list.length}]
                    </Typography>

                    <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Guest</TableCell>
                            <TableCell>People</TableCell>
                            <TableCell>Room</TableCell>
                            <TableCell>Check in</TableCell>
                            <TableCell>Check out</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {list.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.guestName}</TableCell>
                              <TableCell>{r.numGuests ?? "-"}</TableCell>
                              <TableCell>
                                {r.room?.villa?.name} , {r.room?.name}
                              </TableCell>
                              <TableCell>{formatDateTime(r.checkIn)}</TableCell>
                              <TableCell>{formatDateTime(r.checkOut)}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={r.status}
                                  color={
                                    r.status === "checked_in"
                                      ? "warning"
                                      : r.status === "checked_out"
                                      ? "success"
                                      : "info"
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                  {r.status === "booked" && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => handleCheckIn(r.id)}
                                      disabled={actionId === r.id}
                                    >
                                      {actionId === r.id ? "Checking in..." : "Check in"}
                                    </Button>
                                  )}
                                  {r.status === "checked_in" && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleCheckOut(r.id)}
                                      disabled={actionId === r.id}
                                    >
                                      {actionId === r.id ? "Checking out..." : "Check out"}
                                    </Button>
                                  )}
                                  {r.status === "checked_out" && r.room?.status === "checked_out" && r.room?.id && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleClean(r.room!.id)}
                                      disabled={actionId === r.room!.id}
                                    >
                                      {actionId === r.room!.id ? "Cleaning..." : "Mark cleaned"}
                                    </Button>
                                  )}
                                  <IconButton onClick={() => setSelected(r)}>
                                    <ChevronRightIcon />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        PaperProps={{ sx: { width: 380, p: 3 } }}
      >
        {selected && (
          <Stack spacing={2}>
            <Typography variant="h6">Reservation details</Typography>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Guest</Typography>
              <Typography variant="body2">{selected.guestName}</Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Number of guests</Typography>
              <Typography variant="body2">{selected.numGuests ?? "-"}</Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Passport number</Typography>
              <Typography variant="body2">{selected.passportNumber || "-"}</Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Booked via</Typography>
              <Typography variant="body2">{selected.source || "-"}</Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Payment method</Typography>
              <Typography variant="body2">{selected.paymentMethod || "-"}</Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Contact</Typography>
              <Typography variant="body2">Phone {selected.phone || "-"}</Typography>
              <Typography variant="body2">Email {selected.email || "-"}</Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Stay</Typography>
              <Typography variant="body2">Check in {formatDateTime(selected.checkIn)}</Typography>
              <Typography variant="body2">Check out {formatDateTime(selected.checkOut)}</Typography>
              <Typography variant="body2">Status {selected.status}</Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Room</Typography>
              <Typography variant="body2">
                {selected.room?.villa?.name} , {selected.room?.name} , {selected.room?.status}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Notes</Typography>
              <Typography variant="body2">{selected.notes || "No notes"}</Typography>
            </Stack>

            {selected.status === "checked_out" && selected.room?.status === "checked_out" && selected.room?.id && (
              <Alert
                severity="warning"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => handleClean(selected.room!.id)}
                    disabled={actionId === selected.room!.id}
                  >
                    {actionId === selected.room!.id ? "Cleaning..." : "Mark cleaned"}
                  </Button>
                }
              >
                Room needs cleaning
              </Alert>
            )}
          </Stack>
        )}
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ open: false, message: "", severity: "success" })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}
