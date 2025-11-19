import type {
  Room,
  Reservation} from "src/api/client";

import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Card,
  Chip,
  Alert,
  Stack,
  Table,
  Button,
  Drawer,
  MenuItem,
  Snackbar,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  CardContent,
  TableContainer,
  CircularProgress,
} from "@mui/material";

import { DashboardContent } from "src/layouts/dashboard";
import {
  getRooms,
  updateRoom,
  deleteRoom,
  getReservations
} from "src/api/client";

function formatDateTime(value: string | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

type RoomStatusGroup = "checked_in" | "reserved" | "available" | "checked_out";

const ROOM_GROUP_ORDER: RoomStatusGroup[] = [
  "checked_in",
  "reserved",
  "available",
  "checked_out",
];

const ROOM_GROUP_LABEL: Record<RoomStatusGroup, string> = {
  checked_in: "Currently checked in",
  reserved: "Reserved",
  available: "Available",
  checked_out: "Recently checked out",
};

export function RoomsView() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<Partial<Room>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [roomsData, reservationsData] = await Promise.all([
        getRooms(),
        getReservations(),
      ]);
      setRooms(roomsData);
      setReservations(reservationsData);
    } finally {
      setLoading(false);
    }
  }

  function groupedRooms() {
    const groups: Partial<Record<RoomStatusGroup, Room[]>> = {};
    rooms.forEach((room) => {
      const status = (room.status || "available") as RoomStatusGroup;
      if (!groups[status]) groups[status] = [];
      groups[status]!.push(room);
    });
    return groups;
  }

  function handleEditClick(room: Room) {
    setSelectedRoom(room);
    setForm({ ...room });
    setError(null);
  }

  function handleCloseDrawer() {
    setSelectedRoom(null);
    setForm({});
  }

  function currentReservationFor(room: Room | null): Reservation | null {
    if (!room) return null;
    return (
      reservations.find(
        (r) =>
          r.room?.id === room.id &&
          (r.status === "booked" || r.status === "checked_in"),
      ) || null
    );
  }

  function pastReservationsFor(room: Room | null): Reservation[] {
    if (!room) return [];
    return reservations
      .filter(
        (r) =>
          r.room?.id === room.id &&
          (r.status === "checked_out" || r.checkOut < new Date().toISOString()),
      )
      .sort(
        (a, b) =>
          new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime(),
      )
      .slice(0, 5); // last 5 stays
  }

  async function handleSave() {
    if (!selectedRoom) return;
    setSaving(true);
    try {
      const updated = await updateRoom(selectedRoom.id, {
        name: form.name,
        capacity: form.capacity,
        status: form.status,
      });
      setRooms((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      setSnackbar({ open: true, message: "Room updated successfully" });
      handleCloseDrawer();
    } catch (err) {
      console.error(err);
      setError("Failed to update room.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedRoom) return;
    if (!confirm(`Delete ${selectedRoom.name}?`)) return;
    try {
      await deleteRoom(selectedRoom.id);
      setRooms((prev) => prev.filter((r) => r.id !== selectedRoom.id));
      setSnackbar({ open: true, message: "Room deleted successfully" });
      handleCloseDrawer();
    } catch (err) {
      console.error(err);
      setError("Failed to delete room.");
    }
  }

  const groups = groupedRooms();
  const currentRes = currentReservationFor(selectedRoom);
  const pastRes = pastReservationsFor(selectedRoom);

  return (
    <DashboardContent maxWidth="lg">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">Rooms</Typography>

        <Button
          variant="contained"
          component={RouterLink}
          to="/rooms/new"
          size="small"
        >
          Add room
        </Button>
      </Stack>

      <Card>
        <CardContent>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Stack spacing={4}>
              {ROOM_GROUP_ORDER.map((key) => {
                const list = groups[key];
                if (!list || list.length === 0) return null;

                return (
                  <Stack key={key} spacing={1}>
                    <Typography variant="subtitle1" sx={{ px: 1 }}>
                      {ROOM_GROUP_LABEL[key]} [{list.length}]
                    </Typography>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Room</TableCell>
                            <TableCell>Villa</TableCell>
                            <TableCell>Capacity</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {list.map((room) => (
                            <TableRow key={room.id}>
                              <TableCell>{room.name}</TableCell>
                              <TableCell>{room.villa?.name}</TableCell>
                              <TableCell>{room.capacity}</TableCell>
                              <TableCell>
                                <Chip
                                  label={room.status}
                                  color={
                                    room.status === "available"
                                      ? "success"
                                      : room.status === "checked_in"
                                      ? "warning"
                                      : "default"
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  onClick={() => handleEditClick(room)}
                                >
                                  <ChevronRightIcon />
                                </IconButton>
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
        open={Boolean(selectedRoom)}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: 360, p: 3 },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Edit room
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            label="Name"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <TextField
            label="Capacity"
            type="number"
            value={form.capacity || ""}
            onChange={(e) =>
              setForm({ ...form, capacity: Number(e.target.value) })
            }
          />

          <TextField
            label="Status"
            select
            value={form.status || "available"}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <MenuItem value="available">available</MenuItem>
            <MenuItem value="reserved">reserved</MenuItem>
            <MenuItem value="checked_in">checked_in</MenuItem>
            <MenuItem value="checked_out">checked_out</MenuItem>
          </TextField>

          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Current renter</Typography>
            {currentRes ? (
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  Guest  {currentRes.guestName}
                </Typography>
                <Typography variant="body2">
                  Check in  {formatDateTime(currentRes.checkIn)}
                </Typography>
                <Typography variant="body2">
                  Check out  {formatDateTime(currentRes.checkOut)}
                </Typography>
                <Typography variant="body2">
                  Status  {currentRes.status}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No active reservation for this room.
              </Typography>
            )}
          </Stack>

          <Stack spacing={1} sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Previous stays</Typography>
            {pastRes.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No previous stays recorded.
              </Typography>
            )}
            {pastRes.map((r) => (
              <Stack
                key={r.id}
                spacing={0.25}
                sx={{ borderLeft: "2px solid", pl: 1, borderColor: "divider" }}
              >
                <Typography variant="body2">
                  {r.guestName}  ({r.status})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(r.checkIn)}  to  {formatDateTime(r.checkOut)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button
              color="error"
              variant="outlined"
              onClick={handleDelete}
              disabled={saving}
            >
              Delete
            </Button>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleCloseDrawer}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </DashboardContent>
  );
}
