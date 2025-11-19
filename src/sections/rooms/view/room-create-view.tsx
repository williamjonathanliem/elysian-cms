import type { Villa } from "src/api/client";

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

import { getVillas, createRoom } from "src/api/client";
import { DashboardContent } from "src/layouts/dashboard";

interface FormState {
  villaId: string;
  name: string;
  capacity: string;
}

export function RoomCreateView() {
  const navigate = useNavigate();

  const [villas, setVillas] = useState<Villa[]>([]);
  const [form, setForm] = useState<FormState>({
    villaId: "",
    name: "",
    capacity: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVillas()
      .then((data) => setVillas(data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load villas.");
      })
      .finally(() => setLoading(false));
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.villaId || !form.name || !form.capacity) {
      setError("Please fill in all fields.");
      return;
    }

    const capacityNumber = Number(form.capacity);
    if (Number.isNaN(capacityNumber) || capacityNumber <= 0) {
      setError("Capacity must be a positive number.");
      return;
    }

    try {
      setSubmitting(true);
      await createRoom({
        villaId: Number(form.villaId),
        name: form.name,
        capacity: capacityNumber,
      });
      navigate("/rooms");
    } catch (err) {
      console.error(err);
      setError("Failed to create room.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardContent maxWidth="sm">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Add room
      </Typography>

      <Card>
        <CardContent>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <CircularProgress />
            </Stack>
          ) : villas.length === 0 ? (
            <Alert severity="warning">
              There are no villas yet. Please create a villa from the backend
              first.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                  select
                  label="Villa"
                  name="villaId"
                  value={form.villaId}
                  onChange={handleChange}
                  fullWidth
                  required
                >
                  {villas.map((villa) => (
                    <MenuItem key={villa.id} value={villa.id}>
                      {villa.name} ({villa.location})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Room name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  fullWidth
                  required
                />

                <TextField
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={form.capacity}
                  onChange={handleChange}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate("/rooms")}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save room"}
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
