// src/api/client.ts

import { supabase } from "../lib/supabaseClient";

// Auth user type
export type AuthUser = {
  id: number;
  username: string;
  role: string;
};

// Core types based on your schema
export interface Villa {
  id: number;
  name: string;
  location: string;
  createdAt: string;
}

export interface Room {
  id: number;
  villaId: number;
  name: string;
  capacity: number;
  status: string;
  createdAt: string;
  // attached manually from Villa table for UI
  villa?: Villa;
}

export interface Reservation {
  id: number;
  roomId: number;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  createdAt: string;
  email?: string;
  nationality?: string;
  notes?: string;
  numGuests?: number;
  passportNumber?: string;
  phone?: string;
  source?: string;
  paymentMethod?: string;
  // attached manually from Room (and then Villa) for UI
  room?: Room;
}

// Housekeeping info used by dashboard and notifications
export interface HousekeepingItem {
  roomId: number;
  roomName: string;
  villaName: string;
  status: string;
  lastGuest: string | null;
  lastCheckOut: string | null;
}

// Dashboard summary
export interface DashboardSummary {
  totalRooms: number;
  occupiedRooms: number;
  reservationsToday: Reservation[];
}

// small helper to attach villas to rooms
async function loadRoomsWithVillas(): Promise<Room[]> {
  const { data: rooms, error: roomError } = await supabase
    .from("Room")
    .select("*")
    .order("id");

  if (roomError) throw roomError;

  const { data: villas, error: villaError } = await supabase
    .from("Villa")
    .select("*")
    .order("id");

  if (villaError) throw villaError;

  const villaMap = new Map<number, Villa>();
  (villas || []).forEach((v) => villaMap.set(v.id, v as Villa));

  return (rooms || []).map((r) => ({
    ...(r as Room),
    villa: villaMap.get((r as Room).villaId),
  }));
}

// small helper to attach rooms (with villas) to reservations
async function loadReservationsWithRooms(): Promise<Reservation[]> {
  const rooms = await loadRoomsWithVillas();

  const { data: reservations, error } = await supabase
    .from("Reservation")
    .select("*")
    .order("id");

  if (error) throw error;

  const roomMap = new Map<number, Room>();
  rooms.forEach((r) => roomMap.set(r.id, r));

  return (reservations || []).map((res) => ({
    ...(res as Reservation),
    room: roomMap.get((res as Reservation).roomId),
  }));
}

// ========== AUTH ==========
// simple demo auth using the User table and localStorage
// not secure for real production, fine for coursework or internal tool

const AUTH_STORAGE_KEY = "elysian_current_user";

export async function login(username: string, password: string) {
  const { data, error } = await supabase
    .from("User")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !data) {
    throw new Error("Invalid username or password");
  }

  const user: AuthUser = {
    id: data.id,
    username: data.username,
    role: data.role,
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  return user;
}

export async function fetchMe() {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as AuthUser;
    return user;
  } catch {
    return null;
  }
}

export async function logout() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

// ========== ROOMS ==========

export async function getRooms() {
  return loadRoomsWithVillas();
}

export async function createRoom(payload: {
  villaId: number;
  name: string;
  capacity: number;
}) {
  const { data, error } = await supabase
    .from("Room")
    .insert([{ ...payload, status: "available" }])
    .select()
    .single();

  if (error) throw error;
  // re attach villa
  const [room] = await loadRoomsWithVillas();
  return (room ?? data) as Room;
}

export async function updateRoom(id: number, payload: Partial<Room>) {
  const { data, error } = await supabase
    .from("Room")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Room;
}

export async function deleteRoom(id: number) {
  const { error } = await supabase.from("Room").delete().eq("id", id);
  if (error) throw error;
}

// ========== VILLAS ==========

export async function getVillas() {
  const { data, error } = await supabase
    .from("Villa")
    .select("*")
    .order("id");

  if (error) throw error;
  return data as Villa[];
}

// ========== RESERVATIONS ==========

export async function getReservations() {
  return loadReservationsWithRooms();
}

export async function createReservation(payload: {
  roomId: number;
  guestName: string;
  checkIn: string;
  checkOut: string;
  numGuests?: number;
  passportNumber?: string;
  nationality?: string;
  source?: string;
  phone?: string;
  email?: string;
  notes?: string;
  paymentMethod?: string;
}) {
  const { data, error } = await supabase
    .from("Reservation")
    .insert([{ ...payload, status: "booked" }])
    .select()
    .single();

  if (error) throw error;
  // refresh with attached room
  const reservations = await loadReservationsWithRooms();
  const created = reservations.find((r) => r.id === data?.id);
  return (created ?? data) as Reservation;
}

export async function checkInReservation(id: number) {
  const { data, error } = await supabase
    .from("Reservation")
    .update({ status: "checked in" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Reservation;
}

export async function checkOutReservation(id: number) {
  const { data, error } = await supabase
    .from("Reservation")
    .update({ status: "checked out" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Reservation;
}

// range used by calendar and operations cards
export async function getReservationsRange(startISO: string, endISO: string) {
  const { data, error } = await supabase
    .from("Reservation")
    .select("*")
    .gte("checkIn", startISO)
    .lt("checkOut", endISO)
    .order("checkIn");

  if (error) throw error;

  // attach rooms
  const rooms = await loadRoomsWithVillas();
  const roomMap = new Map<number, Room>();
  rooms.forEach((r) => roomMap.set(r.id, r));

  return (data || []).map((res) => ({
    ...(res as Reservation),
    room: roomMap.get((res as Reservation).roomId),
  }));
}

// ========== HOUSEKEEPING AND DASHBOARD ==========

export async function getHousekeeping(): Promise<HousekeepingItem[]> {
  const rooms = await loadRoomsWithVillas();
  const reservations = await loadReservationsWithRooms();

  const items: HousekeepingItem[] = rooms.map((room) => {
    const pastReservations = reservations
      .filter((r) => r.roomId === room.id)
      .sort(
        (a, b) =>
          new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime(),
      );

    const last = pastReservations[0];

    return {
      roomId: room.id,
      roomName: room.name,
      villaName: room.villa?.name ?? "",
      status: room.status,
      lastGuest: last ? last.guestName : null,
      lastCheckOut: last ? last.checkOut : null,
    };
  });

  return items;
}

export async function markRoomClean(roomId: number) {
  const { data, error } = await supabase
    .from("Room")
    .update({ status: "available" })
    .eq("id", roomId)
    .select()
    .single();

  if (error) throw error;
  return data as Room;
}

export async function getDashboard(): Promise<DashboardSummary> {
  const rooms = await loadRoomsWithVillas();
  const reservations = await loadReservationsWithRooms();

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  const occupiedRooms = reservations.filter((res) => {
    const start = new Date(res.checkIn).getTime();
    const end = new Date(res.checkOut).getTime();
    const t = now.getTime();
    return t >= start && t < end && res.status !== "cancelled";
  }).length;

  const reservationsToday = reservations.filter((res) => {
    const start = new Date(res.checkIn).getTime();
    const within =
      start >= todayStart.getTime() && start < todayEnd.getTime();
    return within;
  });

  return {
    totalRooms: rooms.length,
    occupiedRooms,
    reservationsToday,
  };
}

// ========== USER ACCOUNTS (ADMIN) ==========

export interface UserAccount {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

export async function getUsers() {
  const { data, error } = await supabase
    .from("User")
    .select("id, username, role, createdAt")
    .order("id");

  if (error) throw error;
  return data as UserAccount[];
}

export async function createUserAccount(payload: {
  username: string;
  password: string;
  role: string;
}) {
  const { data, error } = await supabase
    .from("User")
    .insert([payload])
    .select("id, username, role, createdAt")
    .single();

  if (error) throw error;
  return data as UserAccount;
}

export async function updateUserAccount(
  id: number,
  payload: {
    username?: string;
    password?: string;
    role?: string;
  },
) {
  const { data, error } = await supabase
    .from("User")
    .update(payload)
    .eq("id", id)
    .select("id, username, role, createdAt")
    .single();

  if (error) throw error;
  return data as UserAccount;
}

export async function deleteUserAccount(id: number) {
  const { error } = await supabase.from("User").delete().eq("id", id);
  if (error) throw error;
}
