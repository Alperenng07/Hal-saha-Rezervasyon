import {
  parse,
  addMinutes,
  addDays,
  isBefore,
  isAfter,
  format,
  startOfDay,
} from "date-fns";

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
