import type { Reservation } from "src/api/client";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import Button from "@mui/material/Button";

export default function ExportReservationsButton({ rows }: { rows: Reservation[] }) {
  function handleExport() {
    const data = rows.map((r) => ({
      Guest: r.guestName,
      People: r.numGuests ?? "",
      Nationality: r.nationality ?? "",
      Passport: r.passportNumber ?? "",
      Source: r.source ?? "",
      Payment: r.paymentMethod ?? "",
      Phone: r.phone ?? "",
      Email: r.email ?? "",
      Villa: r.room?.villa?.name ?? "",
      Room: r.room?.name ?? "",
      Check_in: new Date(r.checkIn).toLocaleString(),
      Check_out: new Date(r.checkOut).toLocaleString(),
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reservations");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "reservations.xlsx");
  }

  return (
    <Button size="small" variant="outlined" onClick={handleExport}>
      Export to Excel
    </Button>
  );
}
