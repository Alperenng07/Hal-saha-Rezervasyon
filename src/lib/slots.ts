import {
  parse,
  addMinutes,
  addDays,
  isBefore,
  isAfter,
  format,
  startOfDay,
} from "date-fns";
import { tr } from "date-fns/locale";

export type PitchSchedule = {
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  slotOffsetMinutes: number;
};

export type TimeSlot = {
  startTime: string;
  endTime: string;
};

function normalizeTime(time: string): string {
  return time.trim().slice(0, 5);
}

export function generateSlots(p: PitchSchedule): TimeSlot[] {
  const openTime = normalizeTime(p.openTime);
  const closeTime = normalizeTime(p.closeTime);
  const duration = p.slotDurationMinutes || 60;
  const offset = p.slotOffsetMinutes || 0;

  if (!openTime || !closeTime || duration <= 0) return [];

  const base = startOfDay(new Date());
  let current = parse(openTime, "HH:mm", base);
  let end = parse(closeTime, "HH:mm", base);

  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  if (!isBefore(current, end)) {
    end = addDays(end, 1);
  }

  current = addMinutes(current, offset);

  const slots: TimeSlot[] = [];

  while (isBefore(current, end)) {
    const slotEnd = addMinutes(current, duration);
    if (isAfter(slotEnd, end)) break;

    slots.push({
      startTime: format(current, "HH:mm"),
      endTime: format(slotEnd, "HH:mm"),
    });
    current = slotEnd;
  }

  return slots;
}

export { normalizeTime };

/** Gece yarısından sonra, açılış saatinden önceki slotlar (örn. 03:00, açılış 12:00) */
export function isOvernightSlot(startTime: string, openTime: string): boolean {
  return normalizeTime(startTime) < normalizeTime(openTime);
}

/** Rezervasyonda kaydedilecek iş günü — sütundaki gün (Cuma 03:00 → Cuma) */
export function getBookingDate(businessDay: Date, _startTime: string, _openTime: string): Date {
  return startOfDay(businessDay);
}

/** Slotun gerçek takvim zamanı (Cuma 03:00 → Cumartesi 03:00) */
export function getActualSlotDateTime(
  businessDay: Date,
  startTime: string,
  openTime: string
): Date {
  const base = startOfDay(businessDay);
  if (isOvernightSlot(startTime, openTime)) {
    return parse(normalizeTime(startTime), "HH:mm", addDays(base, 1));
  }
  return parse(normalizeTime(startTime), "HH:mm", base);
}

/** Şu an hangi iş günündeyiz (gece 00:00–kapanış arası → önceki gün) */
export function getCurrentBusinessDay(openTime: string, closeTime: string, now = new Date()): Date {
  const open = normalizeTime(openTime);
  const close = normalizeTime(closeTime);
  const nowMinutes = normalizeTime(format(now, "HH:mm"));

  const isOvernightSchedule = close <= open;
  if (isOvernightSchedule && nowMinutes < open && nowMinutes < close) {
    return addDays(startOfDay(now), -1);
  }
  return startOfDay(now);
}

export function formatSlotLabel(
  businessDay: Date,
  startTime: string,
  openTime: string
): string {
  if (isOvernightSlot(startTime, openTime)) {
    const nextDay = addDays(businessDay, 1);
    return `${startTime} (${format(nextDay, "d MMM", { locale: tr })} sabahı)`;
  }
  return startTime;
}
