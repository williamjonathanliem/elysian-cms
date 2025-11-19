// src/sections/dashboard/cleaning-summary.tsx
import type { HousekeepingItem } from "src/api/client";

import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { markRoomClean, getHousekeeping } from "src/api/client";

const NEEDS_CLEANING_STATUSES = ["recently_checked_out", "maintenance"];

export default function CleaningSummary() {
  const [items, setItems] = useState<HousekeepingItem[]>([]);
  const [loading, setLoading] = useState(false);

  // load housekeeping list
  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getHousekeeping();
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  }

  // filter list for rooms needing cleaning
  const roomsToClean = useMemo(
    () => items.filter((item) => NEEDS_CLEANING_STATUSES.includes(item.status)),
    [items],
  );

  async function handleMarkClean(roomId: number) {
    try {
      await markRoomClean(roomId);
      await load();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Cleaning summary"
        action={
          <Chip
            label={`${roomsToClean.length} to clean`}
            color={roomsToClean.length > 0 ? "warning" : "default"}
            variant="outlined"
          />
        }
      />

      <CardContent>
        {loading && items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Loading housekeeping data...
          </Typography>
        ) : roomsToClean.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            All rooms are cleaned or currently occupied.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
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
                {roomsToClean.map((item) => (
                  <TableRow key={item.roomId}>
                    <TableCell>{item.villaName}</TableCell>
                    <TableCell>{item.roomName}</TableCell>
                    <TableCell>{item.lastGuest ?? "-"}</TableCell>
                    <TableCell>{item.lastCheckOut ?? "-"}</TableCell>
                    <TableCell>0h</TableCell>

                    <TableCell>
                      <Chip
                        label={item.status}
                        color={
                          item.status === "maintenance" ? "warning" : "error"
                        }
                        sx={{ textTransform: "none" }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleMarkClean(item.roomId)}
                        >
                          Mark cleaned
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
