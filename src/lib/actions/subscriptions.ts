"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";

type ActionResult = { success: true } | { error: string };

export async function createSubscription(input: {
  pitchId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate?: string;
  guestName: string;
  guestPhone: string;
  notes?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Yetkisiz işlem." };

  const name = input.guestName.trim();
  const phone = input.guestPhone.trim();
  if (!name) return { error: "Abone adı zorunludur." };
  if (!phone) return { error: "Telefon numarası zorunludur." };

  if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
    return { error: "Geçersiz gün seçimi." };
  }

  const pitch = await prisma.pitch.findUnique({ where: { id: input.pitchId } });
  if (!pitch) return { error: "Saha bulunamadı." };

  const startDate = new Date(input.startDate);
  const endDate = input.endDate ? new Date(input.endDate) : null;

  if (endDate && endDate < startDate) {
    return { error: "Bitiş tarihi başlangıçtan önce olamaz." };
  }

  const conflict = await prisma.subscription.findFirst({
    where: {
      pitchId: input.pitchId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      isActive: true,
      startDate: endDate ? { lte: endDate } : undefined,
      OR: [{ endDate: null }, { endDate: { gte: startDate } }],
    },
  });

  if (conflict) {
    return { error: "Bu saha, gün ve saat için aktif abonelik zaten var." };
  }

  await prisma.subscription.create({
    data: {
      pitchId: input.pitchId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      startDate,
      endDate,
      guestName: name,
      guestPhone: phone,
      notes: input.notes?.trim() || null,
      isActive: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function skipSubscriptionOccurrence(input: {
  subscriptionId: string;
  date: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Yetkisiz işlem." };

  const subscription = await prisma.subscription.findUnique({
    where: { id: input.subscriptionId },
  });
  if (!subscription || !subscription.isActive) {
    return { error: "Abonelik bulunamadı." };
  }

  const occurrenceDate = startOfDay(new Date(input.date));

  const existingBooking = await prisma.booking.findFirst({
    where: {
      pitchId: subscription.pitchId,
      date: occurrenceDate,
      startTime: subscription.startTime,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
  });
  if (existingBooking) {
    return { error: "Bu hafta için zaten rezervasyon var." };
  }

  try {
    await prisma.subscriptionException.create({
      data: {
        subscriptionId: input.subscriptionId,
        date: occurrenceDate,
      },
    });
  } catch {
    return { error: "Bu hafta zaten iptal edilmiş olabilir." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function deactivateSubscription(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Yetkisiz işlem." };

  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) return { error: "Abonelik bulunamadı." };

  await prisma.subscription.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/calendar");
  return { success: true };
}
