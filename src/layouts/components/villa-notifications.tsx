import { useEffect, useState } from 'react';

import {
    getHousekeeping,
    getReservations,
    type HousekeepingItem,
    type Reservation,
  } from 'src/api/client';

import { NotificationsPopover } from './notifications-popover';


// Shape compatible with NotificationsPopover internal data
type NotificationItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  avatarUrl: string | null;
  isUnRead: boolean;
  postedAt: string | number | null;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toIsoOrNull(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.toISOString();
}

// 2. room needs cleaning (from housekeeping endpoint)
function buildCleaningNotifications(items: HousekeepingItem[]): NotificationItem[] {
  return items.map((item) => ({
    id: `clean-${item.roomId}`,
    type: 'cleaning',
    title: `Kamar perlu dibersihkan: ${item.villaName} , ${item.roomName}`,
    description: item.lastGuest
      ? `Tamu terakhir: ${item.lastGuest}`
      : 'Kamar ini baru saja check out dan perlu dibersihkan.',
    avatarUrl: '/assets/icons/notification/ic-notification-chat.svg',
    postedAt: toIsoOrNull(item.lastCheckOut ?? null),
    isUnRead: true,
  }));
}

// 4. today who is checking in
function buildTodayCheckInNotifications(items: Reservation[], today: Date): NotificationItem[] {
  return items
    .filter((r) => isSameDay(new Date(r.checkIn), today))
    .map((r) => ({
      id: `checkin-today-${r.id}`,
      type: 'checkin_today',
      title: `Check in hari ini: ${r.guestName}`,
      description: r.room
        ? `${r.room.villa?.name || ''} , ${r.room.name}`
        : 'Reservasi tanpa kamar spesifik',
      avatarUrl: '/assets/icons/notification/ic-notification-mail.svg',
      postedAt: toIsoOrNull(r.checkIn),
      isUnRead: true,
    }));
}

// 3. booking finishing today
function buildTodayCheckoutNotifications(items: Reservation[], today: Date): NotificationItem[] {
  return items
    .filter((r) => isSameDay(new Date(r.checkOut), today))
    .map((r) => ({
      id: `checkout-today-${r.id}`,
      type: 'checkout_today',
      title: `Check out hari ini: ${r.guestName}`,
      description: r.room
        ? `${r.room.villa?.name || ''} , ${r.room.name}`
        : 'Reservasi selesai hari ini',
      avatarUrl: '/assets/icons/notification/ic-notification-chat.svg',
      postedAt: toIsoOrNull(r.checkOut),
      isUnRead: true,
    }));
}

// 1. nearby booking, minus one day before
function buildTomorrowCheckInNotifications(items: Reservation[], today: Date): NotificationItem[] {
  const tomorrow = addDays(today, 1);
  return items
    .filter((r) => isSameDay(new Date(r.checkIn), tomorrow))
    .map((r) => ({
      id: `checkin-tomorrow-${r.id}`,
      type: 'checkin_tomorrow',
      title: `Check in besok: ${r.guestName}`,
      description: r.room
        ? `${r.room.villa?.name || ''} , ${r.room.name}`
        : 'Reservasi tanpa kamar spesifik',
      avatarUrl: '/assets/icons/notification/ic-notification-mail.svg',
      postedAt: toIsoOrNull(r.checkIn),
      isUnRead: true,
    }));
}

export function VillaNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const today = new Date();

        const [housekeeping, reservations] = await Promise.all([
          getHousekeeping(),
          getReservations(),
        ]);

        console.log('[VillaNotifications] today', today.toDateString());
        console.log('[VillaNotifications] reservations', reservations);
        console.log('[VillaNotifications] housekeeping', housekeeping);

        const cleaning = buildCleaningNotifications(housekeeping);
        const todayCheckIn = buildTodayCheckInNotifications(reservations, today);
        const todayCheckout = buildTodayCheckoutNotifications(reservations, today);
        const tomorrowCheckIn = buildTomorrowCheckInNotifications(reservations, today);

        console.log('[VillaNotifications] counts', {
          cleaning: cleaning.length,
          todayCheckIn: todayCheckIn.length,
          todayCheckout: todayCheckout.length,
          tomorrowCheckIn: tomorrowCheckIn.length,
        });

        setItems([
          ...cleaning,
          ...todayCheckIn,
          ...todayCheckout,
          ...tomorrowCheckIn,
        ]);
      } catch (error) {
        console.error('[VillaNotifications] failed to load', error);
      }
    }

    load();
  }, []);

  return <NotificationsPopover data={items} />;
}
