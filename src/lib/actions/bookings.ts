"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { error: string };

export async function createBooking(input: {
  pitchId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): Promise<ActionResult> {
  const user = await requireAuth();
  if (!user) {
    return { error: "Rezervasyon yapmak için giriş yapmalısınız." };
  }

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

  try {
    await prisma.booking.create({
      data: {
        pitchId: input.pitchId,
        userId: user.id,
        date: bookingDate,
        startTime: input.startTime,
        endTime: input.endTime,
        notes: input.notes || null,
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

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!user) {
    return { error: "Yetkisiz işlem." };
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { error: "Rezervasyon bulunamadı." };
  }

  if (user.role !== "ADMIN" && booking.userId !== user.id) {
    return { error: "Bu rezervasyonu iptal etme yetkiniz yok." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
