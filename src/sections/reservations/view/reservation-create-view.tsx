import type { Room } from "src/api/client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  Alert,
  Stack,
  Button,
  MenuItem,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
} from "@mui/material";

import { DashboardContent } from "src/layouts/dashboard";
import { getRooms, createReservation } from "src/api/client";

interface FormState {
  roomId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  numGuests: string;
  passportNumber: string;
  nationality: string;
  source: string;
  phone: string;
  email: string;
  notes: string;
  paymentMethod: string;
}

export function ReservationCreateView() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    roomId: "",
    guestName: "",
    checkIn: "",
    checkOut: "",
    numGuests: "",
    passportNumber: "",
    nationality: "",
    source: "",
    phone: "",
    email: "",
    notes: "",
    paymentMethod: "",
  });

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    setLoadingRooms(true);
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load rooms.");
    } finally {
      setLoadingRooms(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.roomId || !form.guestName || !form.checkIn || !form.checkOut) {
      setError("Room, guest name, check in and check out are required.");
      return;
    }

    const roomId = Number(form.roomId);
    const numGuests =
      form.numGuests.trim() === "" ? undefined : Number(form.numGuests);

    if (Number.isNaN(roomId)) {
      setError("Room is invalid.");
      return;
    }
    if (numGuests !== undefined && (Number.isNaN(numGuests) || numGuests <= 0)) {
      setError("Number of guests must be a positive number.");
      return;
    }

    try {
      setSubmitting(true);
      await createReservation({
        roomId,
        guestName: form.guestName,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        numGuests,
        passportNumber: form.passportNumber || undefined,
        nationality: form.nationality || undefined,
        source: form.source || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        notes: form.notes || undefined,
        paymentMethod: form.paymentMethod || undefined,
      });
      
      navigate("/reservations");
    } catch (err) {
      console.error(err);
      setError("Failed to create reservation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardContent maxWidth="sm">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Add reservation
      </Typography>

      <Card>
        <CardContent>
          {loadingRooms ? (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <CircularProgress />
            </Stack>
          ) : rooms.length === 0 ? (
            <Alert severity="warning">
              There are no rooms yet. Please create a room first.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                  select
                  label="Room"
                  name="roomId"
                  value={form.roomId}
                  onChange={handleChange}
                  required
                  fullWidth
                >
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.villa?.name} , {room.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Full name"
                  name="guestName"
                  value={form.guestName}
                  onChange={handleChange}
                  required
                  fullWidth
                />

                <TextField
                  label="Number of guests"
                  name="numGuests"
                  type="number"
                  value={form.numGuests}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 1 }}
                />

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Check in"
                    name="checkIn"
                    type="datetime-local"
                    value={form.checkIn}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Check out"
                    name="checkOut"
                    type="datetime-local"
                    value={form.checkOut}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>

                <TextField
                  label="Nationality"
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Passport number"
                  name="passportNumber"
                  value={form.passportNumber}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  select
                  label="Booked via"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="">Other</MenuItem>
                  <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                  <MenuItem value="Instagram">Instagram</MenuItem>
                  <MenuItem value="Facebook">Facebook</MenuItem>
                  <MenuItem value="Airbnb">Airbnb</MenuItem>
                  <MenuItem value="Booking.com">Booking.com</MenuItem>
                  <MenuItem value="Walk in">Walk in</MenuItem>
                </TextField>

                <TextField
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  select
                  label="Payment with"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="">Other</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Credit Card">Credit Card</MenuItem>
                  <MenuItem value="Debit Card">Debit Card</MenuItem>
                  <MenuItem value="QRIS/Scan to Pay">QRIS/Scan to Pay</MenuItem>
                </TextField>


                <TextField
                  label="Notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  minRows={3}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate("/reservations")}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save reservation"}
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
