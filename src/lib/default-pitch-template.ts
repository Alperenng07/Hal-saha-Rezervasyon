export const DEFAULT_PITCH_TEMPLATE = {
  name: "Saha 1",
  openTime: "09:00",
  closeTime: "23:00",
  slotDurationMinutes: 60,
  slotOffsetMinutes: 0,
} as const;

export type PitchTemplateInput = {
  name?: string;
  openTime?: string;
  closeTime?: string;
  slotDurationMinutes?: number;
  slotOffsetMinutes?: number;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizePitchTemplate(input?: PitchTemplateInput) {
  const name = input?.name?.trim() || DEFAULT_PITCH_TEMPLATE.name;
  const openTime = input?.openTime?.trim() || DEFAULT_PITCH_TEMPLATE.openTime;
  const closeTime = input?.closeTime?.trim() || DEFAULT_PITCH_TEMPLATE.closeTime;
  const slotDurationMinutes =
    input?.slotDurationMinutes ?? DEFAULT_PITCH_TEMPLATE.slotDurationMinutes;
  const slotOffsetMinutes =
    input?.slotOffsetMinutes ?? DEFAULT_PITCH_TEMPLATE.slotOffsetMinutes;

  if (!name) {
    return { error: "Varsayılan saha adı zorunludur." } as const;
  }
  if (!TIME_PATTERN.test(openTime) || !TIME_PATTERN.test(closeTime)) {
    return { error: "Çalışma saatleri SS:DD formatında olmalıdır." } as const;
  }
  if (slotDurationMinutes < 15 || slotDurationMinutes > 240) {
    return { error: "Seans süresi 15–240 dakika arasında olmalıdır." } as const;
  }

  return {
    data: {
      name,
      openTime,
      closeTime,
      slotDurationMinutes,
      slotOffsetMinutes,
      isActive: true,
    },
  } as const;
}
