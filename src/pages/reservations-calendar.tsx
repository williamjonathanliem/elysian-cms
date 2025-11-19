import { CONFIG } from "src/config-global";

import ReservationsCalendar from "src/sections/reservations/view/reservations-calendar";

export default function Page() {
  return (
    <>
      <title>{`Reservations Calendar, ${CONFIG.appName}`}</title>
      <ReservationsCalendar />
    </>
  );
}
