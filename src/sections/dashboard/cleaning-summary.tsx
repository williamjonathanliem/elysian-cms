import type { HousekeepingItem} from "src/api/client";

import { useMemo, useState, useEffect } from "react";

import {
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { markRoomClean, getHousekeeping } from "src/api/client";

function fmt(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function since(value: string | null) {
  if (!value) return "-";
  const t = new Date(value).getTime();
  const hours = Math.floor(Math.max(0, Date.now() - t) / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function CleaningSummary() {
  const [rows, setRows] = useState<HousekeepingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getHousekeeping();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  const content = useMemo(() => {
    if (loading) {
      return (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      );
    }
    if (rows.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          All rooms are clean.
        </Typography>
      );
    }
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Villa</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Last guest</TableCell>
              <TableCell>Checked out</TableCell>
              <TableCell>Since</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.roomId}>
                <TableCell>{r.villaName}</TableCell>
                <TableCell>{r.roomName}</TableCell>
                <TableCell>{r.lastGuest || "-"}</TableCell>
                <TableCell>{fmt(r.lastCheckOut)}</TableCell>
                <TableCell>{since(r.lastCheckOut)}</TableCell>
                <TableCell>
                  <Chip label={r.status} size="small" color="warning" />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={async () => {
                      setBusyId(r.roomId);
                      try {
                        await markRoomClean(r.roomId);
                        await load();
                      } finally {
                        setBusyId(null);
                      }
                    }}
                    disabled={busyId === r.roomId}
                  >
                    {busyId === r.roomId ? "Cleaning..." : "Mark cleaned"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }, [rows, loading, busyId]);

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">Cleaning summary</Typography>
          <Chip label={`${rows.length} to clean`} size="small" />
        </Stack>
        {content}
      </CardContent>
    </Card>
  );
}
