import { CONFIG } from "src/config-global";

import { ReservationCreateView } from "src/sections/reservations/view/reservation-create-view";

export default function Page() {
  return (
    <>
      <title>{`Add reservation - ${CONFIG.appName}`}</title>
      <ReservationCreateView />
    </>
  );
}
