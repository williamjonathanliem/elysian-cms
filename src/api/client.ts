// src/api/client.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;
if (!BASE_URL) {
  throw new Error("VITE_API_URL is not set");
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// auth
export async function fetchMe() {
  const { data } = await api.get("/api/auth/me");
  return data.user as { id: number, username: string, role: string };
}
export async function login(username: string, password: string) {
  const { data } = await api.post("/api/login", { username, password });
  return data.user as { id: number, username: string, role: string };
}
export async function logout() {
  await api.post("/api/logout");
}

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Request failed ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Types
export interface Villa {
  id: number;
  name: string;
  location: string;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  status: string;
  villa: Villa;
}

export interface Reservation {
  id: number;
  guestName: string;
  nationality?: string;
  passportNumber?: string;
  numGuests?: number;
  source?: string;
  phone?: string;
  email?: string;
  notes?: string;
  paymentMethod?: string;
  checkIn: string;
  checkOut: string;
  status: string;
  room: Room;
}

// Reservations
export function createReservation(data: {
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
  return http<Reservation>("/api/reservations", {
    method: "POST",
    body: JSON.stringify({ ...data, status: "booked" }),
  });
}

// Housekeeping
export interface HousekeepingItem {
  roomId: number;
  roomName: string;
  villaName: string;
  status: string;
  lastGuest: string | null;
  lastCheckOut: string | null;
}

// Dashboard + housekeeping
export interface DashboardSummary {
  totalRooms: number;
  occupiedRooms: number;
  reservationsToday: any[];
}

export function getDashboard() {
  return http<DashboardSummary>("/api/dashboard");
}

export function getRooms() {
  return http<Room[]>("/api/rooms");
}

export function getReservations() {
  return http<Reservation[]>("/api/reservations");
}

export function getVillas() {
  return http<Villa[]>("/api/villas");
}

export function markRoomClean(roomId: number) {
  return http<Room>(`/api/rooms/${roomId}/clean`, { method: "PUT" });
}

export function createRoom(data: {
  villaId: number;
  name: string;
  capacity: number;
}) {
  return http<Room>("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ ...data, status: "available" }),
  });
}

export function updateRoom(id: number, data: Partial<Room>) {
  return http<Room>(`/api/rooms/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteRoom(id: number) {
  return http<void>(`/api/rooms/${id}`, {
    method: "DELETE",
  });
}

export function checkInReservation(id: number) {
  return http<Reservation>(`/api/reservations/${id}/checkin`, {
    method: "PUT",
  });
}

export function checkOutReservation(id: number) {
  return http<Reservation>(`/api/reservations/${id}/checkout`, {
    method: "PUT",
  });
}

export function getHousekeeping() {
  return http<HousekeepingItem[]>("/api/housekeeping");
}

export function getReservationsRange(startISO: string, endISO: string) {
  const q = new URLSearchParams({ start: startISO, end: endISO }).toString();
  return http<Reservation[]>(`/api/reservations?${q}`);
}

// - - - User accounts (admin only) - - -

export interface UserAccount {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

export function getUsers() {
  return http<UserAccount[]>('/api/users');
}

export function createUserAccount(payload: {
  username: string;
  password: string;
  role: string;
}) {
  return http<UserAccount>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUserAccount(
  id: number,
  payload: {
    username?: string;
    password?: string;
    role?: string;
  },
) {
  return http<UserAccount>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteUserAccount(id: number) {
  return http<void>(`/api/users/${id}`, {
    method: 'DELETE',
  });
}