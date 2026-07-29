"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { error: string };

export async function createBooking(input: {
  pitchId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestName: string;
  guestPhone: string;
  notes?: string;
}): Promise<ActionResult> {
  const name = input.guestName.trim();
  const phone = input.guestPhone.trim();

  if (!name) return { error: "Ad soyad zorunludur." };
  if (!phone) return { error: "Telefon numarası zorunludur." };

  const pitch = await prisma.pitch.findFirst({
    where: { id: input.pitchId, isActive: true },
  });
  if (!pitch) {
    return { error: "Saha bulunamadı." };
  }

  const bookingDate = new Date(input.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
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

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function createBookingAdmin(input: {
  pitchId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestName: string;
  guestPhone: string;
  notes?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Yetkisiz işlem." };

  const name = input.guestName.trim();
  const phone = input.guestPhone.trim();
  if (!name) return { error: "Ad soyad zorunludur." };
  if (!phone) return { error: "Telefon numarası zorunludur." };

  const pitch = await prisma.pitch.findUnique({ where: { id: input.pitchId } });
  if (!pitch) return { error: "Saha bulunamadı." };

  const bookingDate = new Date(input.date);

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

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  return { success: true };
}

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { error: "Yetkisiz işlem." };
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { error: "Rezervasyon bulunamadı." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  return { success: true };
}
