"use server";

import prisma from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { notifyOwnerNewBooking } from "@/lib/notifications";
import { getActualSlotDateTime } from "@/lib/slots";
import { getActiveTenantBySlug, tenantPaths } from "@/lib/tenant";
import { isBefore, startOfDay } from "date-fns";

type ActionResult = { success: true } | { error: string };

async function getPitchForTenant(pitchId: string, tenantId: string, activeOnly = false) {
  return prisma.pitch.findFirst({
    where: {
      id: pitchId,
      tenantId,
      ...(activeOnly ? { isActive: true } : {}),
    },
    include: { tenant: true },
  });
}

export async function createBooking(
  tenantSlug: string,
  input: {
    pitchId: string;
    date: string;
    startTime: string;
    endTime: string;
    guestName: string;
    guestPhone: string;
    notes?: string;
  }
): Promise<ActionResult> {
  const tenant = await getActiveTenantBySlug(tenantSlug);
  if (!tenant) return { error: "İşletme bulunamadı." };

  const name = input.guestName.trim();
  const phone = input.guestPhone.trim();

  if (!name) return { error: "Ad soyad zorunludur." };
  if (!phone) return { error: "Telefon numarası zorunludur." };

  const pitch = await getPitchForTenant(input.pitchId, tenant.id, true);
  if (!pitch) {
    return { error: "Saha bulunamadı." };
  }

  const bookingDate = startOfDay(new Date(input.date));
  const actualSlotTime = getActualSlotDateTime(
    bookingDate,
    input.startTime,
    pitch.openTime
  );
  if (isBefore(actualSlotTime, new Date())) {
    return { error: "Geçmiş bir tarih için rezervasyon yapılamaz." };
  }

  const existing = await prisma.booking.findFirst({
    where: {
      pitchId: input.pitchId,
      date: bookingDate,
      startTime: input.startTime,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
  });
  if (existing) {
    return { error: "Bu saat dilimi dolu." };
  }

  const dayOfWeek = bookingDate.getDay();
  const subscribed = await prisma.subscription.findFirst({
    where: {
      pitchId: input.pitchId,
      dayOfWeek,
      startTime: input.startTime,
      isActive: true,
      startDate: { lte: bookingDate },
      OR: [{ endDate: null }, { endDate: { gte: bookingDate } }],
      exceptions: { none: { date: bookingDate } },
    },
  });
  if (subscribed) {
    return { error: "Bu saat abonelik için ayrılmış." };
  }

  try {
    await prisma.booking.create({
      data: {
        pitchId: input.pitchId,
        guestName: name,
        guestPhone: phone,
        date: bookingDate,
        startTime: input.startTime,
        endTime: input.endTime,
        notes: input.notes?.trim() || null,
        status: "CONFIRMED",
      },
    });
  } catch {
    return { error: "Rezervasyon oluşturulamadı. Saat dolu olabilir." };
  }

  try {
    await notifyOwnerNewBooking(
      {
        businessName: tenant.name,
        adminEmail: tenant.adminEmail ?? tenant.email,
        phone: tenant.phone,
        notifyEmailOnBooking: tenant.notifyEmailOnBooking,
        notifyWhatsAppOnBooking: tenant.notifyWhatsAppOnBooking,
        whatsappApiKey: tenant.whatsappApiKey,
        tenantSlug,
      },
      {
        pitchName: pitch.name,
        date: bookingDate,
        startTime: input.startTime,
        endTime: input.endTime,
        guestName: name,
        guestPhone: phone,
        notes: input.notes,
      }
    );
  } catch (err) {
    console.error("[createBooking] Bildirim hatası:", err);
  }

  const paths = tenantPaths(tenantSlug);
  revalidatePath(paths.site);
  revalidatePath(paths.admin);
  return { success: true };
}

export async function createBookingAdmin(
  tenantSlug: string,
  input: {
    pitchId: string;
    date: string;
    startTime: string;
    endTime: string;
    guestName: string;
    guestPhone: string;
    notes?: string;
  }
): Promise<ActionResult> {
  const ctx = await requireTenantAdmin(tenantSlug);
  if (!ctx) return { error: "Yetkisiz işlem." };

  const name = input.guestName.trim();
  const phone = input.guestPhone.trim();
  if (!name) return { error: "Ad soyad zorunludur." };
  if (!phone) return { error: "Telefon numarası zorunludur." };

  const pitch = await getPitchForTenant(input.pitchId, ctx.tenant.id);
  if (!pitch) return { error: "Saha bulunamadı." };

  const bookingDate = startOfDay(new Date(input.date));

  const existing = await prisma.booking.findFirst({
    where: {
      pitchId: input.pitchId,
      date: bookingDate,
      startTime: input.startTime,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
  });
  if (existing) return { error: "Bu saat dilimi dolu." };

  const dayOfWeek = bookingDate.getDay();
  const subscribed = await prisma.subscription.findFirst({
    where: {
      pitchId: input.pitchId,
      dayOfWeek,
      startTime: input.startTime,
      isActive: true,
      startDate: { lte: bookingDate },
      OR: [{ endDate: null }, { endDate: { gte: bookingDate } }],
      exceptions: { none: { date: bookingDate } },
    },
  });
  if (subscribed) return { error: "Bu saat abonelik için ayrılmış." };

  try {
    await prisma.booking.create({
      data: {
        pitchId: input.pitchId,
        guestName: name,
        guestPhone: phone,
        date: bookingDate,
        startTime: input.startTime,
        endTime: input.endTime,
        notes: input.notes?.trim() || null,
        status: "CONFIRMED",
        isManual: true,
      },
    });
  } catch {
    return { error: "Rezervasyon oluşturulamadı. Saat dolu olabilir." };
  }

  const paths = tenantPaths(tenantSlug);
  revalidatePath(paths.site);
  revalidatePath(paths.admin);
  revalidatePath(paths.bookings);
  revalidatePath(paths.calendar);
  return { success: true };
}

export async function cancelBooking(
  tenantSlug: string,
  bookingId: string
): Promise<ActionResult> {
  const ctx = await requireTenantAdmin(tenantSlug);
  if (!ctx) {
    return { error: "Yetkisiz işlem." };
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      pitch: { tenantId: ctx.tenant.id },
    },
  });
  if (!booking) {
    return { error: "Rezervasyon bulunamadı." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  const paths = tenantPaths(tenantSlug);
  revalidatePath(paths.site);
  revalidatePath(paths.admin);
  revalidatePath(paths.bookings);
  revalidatePath(paths.calendar);
  return { success: true };
}
