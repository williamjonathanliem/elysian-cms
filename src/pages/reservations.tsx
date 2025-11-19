import { CONFIG } from "src/config-global";

import { ReservationsView } from "src/sections/reservations/view/reservations-view";

export default function Page() {
  return (
    <>
      <title>{`Reservations - ${CONFIG.appName}`}</title>
      <ReservationsView />
    </>
  );
}
