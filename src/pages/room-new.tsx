import { CONFIG } from "src/config-global";

import { RoomCreateView } from "src/sections/rooms/view/room-create-view";

export default function Page() {
  return (
    <>
      <title>{`Add room - ${CONFIG.appName}`}</title>
      <RoomCreateView />
    </>
  );
}
