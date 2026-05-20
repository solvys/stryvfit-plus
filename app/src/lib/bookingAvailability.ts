export type BookingAvailability = {
  firstStart: string;
  lastStart: string;
  bufferMinutes: number;
  blockedSlots: Record<string, string[]>;
};

export const BOOKING_AVAILABILITY_STORAGE_KEY = 'stryvfit-booking-availability';

export const DEFAULT_BOOKING_AVAILABILITY: BookingAvailability = {
  firstStart: '07:00',
  lastStart: '18:00',
  bufferMinutes: 30,
  blockedSlots: {},
};

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function readBookingAvailability(): BookingAvailability {
  if (typeof window === 'undefined') return DEFAULT_BOOKING_AVAILABILITY;

  try {
    const stored = window.localStorage.getItem(BOOKING_AVAILABILITY_STORAGE_KEY);
    if (!stored) return DEFAULT_BOOKING_AVAILABILITY;
    const parsed = JSON.parse(stored) as Partial<BookingAvailability>;
    return {
      ...DEFAULT_BOOKING_AVAILABILITY,
      ...parsed,
      blockedSlots: parsed.blockedSlots ?? {},
    };
  } catch {
    return DEFAULT_BOOKING_AVAILABILITY;
  }
}

export function saveBookingAvailability(next: BookingAvailability): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BOOKING_AVAILABILITY_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('stryvfit-booking-availability'));
}

export function toggleBlockedSlot(
  availability: BookingAvailability,
  date: Date,
  time: string
): BookingAvailability {
  const key = dateKey(date);
  const current = availability.blockedSlots[key] ?? [];
  const exists = current.includes(time);
  const nextSlots = exists ? current.filter((slot) => slot !== time) : [...current, time].sort();
  return {
    ...availability,
    blockedSlots: {
      ...availability.blockedSlots,
      [key]: nextSlots,
    },
  };
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function buildAvailableTimes(availability: BookingAvailability, durationMinutes: number): string[] {
  const first = timeToMinutes(availability.firstStart);
  const last = timeToMinutes(availability.lastStart);
  const step = Math.max(15, durationMinutes + availability.bufferMinutes);
  const slots: string[] = [];

  for (let value = first; value <= last; value += step) {
    slots.push(minutesToTime(value));
  }

  return slots.length > 0 ? slots : [availability.firstStart];
}
