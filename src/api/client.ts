// src/api/client.ts
import { supabase } from "../lib/supabaseClient";

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
  villaId: number;
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
  roomId: number;
}

// Rooms
export async function getRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, villas(*)");

  if (error) throw error;
  return data as Room[];
}

export async function createRoom(payload: {
  villaId: number;
  name: string;
  capacity: number;
}) {
  const { data, error } = await supabase
    .from("rooms")
    .insert([{ ...payload, status: "available" }])
    .select()
    .single();

  if (error) throw error;
  return data as Room;
}

export async function updateRoom(id: number, payload: Partial<Room>) {
  const { data, error } = await supabase
    .from("rooms")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Room;
}

export async function deleteRoom(id: number) {
  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Villas
export async function getVillas() {
  const { data, error } = await supabase
    .from("villas")
    .select("*");

  if (error) throw error;
  return data as Villa[];
}

// Reservations
export async function getReservations() {
  const { data, error } = await supabase
    .from("reservations")
    .select("*, rooms(*, villas(*))");

  if (error) throw error;
  return data as Reservation[];
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
    .from("reservations")
    .insert([{ ...payload, status: "booked" }])
    .select()
    .single();

  if (error) throw error;
  return data as Reservation;
}

export async function checkInReservation(id: number) {
  const { data, error } = await supabase
    .from("reservations")
    .update({ status: "checked in" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Reservation;
}

export async function checkOutReservation(id: number) {
  const { data, error } = await supabase
    .from("reservations")
    .update({ status: "checked out" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Reservation;
}

// Users
export interface UserAccount {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

export async function getUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*");

  if (error) throw error;
  return data as UserAccount[];
}

export async function createUserAccount(payload: {
  username: string;
  password: string;
  role: string;
}) {
  const { data, error } = await supabase
    .from("users")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data as UserAccount;
}

export async function updateUserAccount(
  id: number,
  payload: Partial<UserAccount>
) {
  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as UserAccount;
}

export async function deleteUserAccount(id: number) {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
