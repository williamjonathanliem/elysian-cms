import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData = [
  { title: "Dashboard", path: "/", icon: icon("ic-analytics") },
  { title: "Rooms", path: "/rooms", icon: icon("ic-home") },
  { title: "Reservations", path: "/reservations", icon: icon("ic-reserved") },
  { title: "Reservations Calendar", path: "/reservations/calendar", icon: icon("ic-calendar") },
];