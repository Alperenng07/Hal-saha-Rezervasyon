"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { error: string };

export async function getAllPitchesAdmin() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.pitch.findMany({ orderBy: { createdAt: "asc" } });
}

export async function savePitch(input: {
  id?: string;
  name: string;
  description?: string;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  slotOffsetMinutes: number;
  isActive?: boolean;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Yetkisiz işlem." };

  const data = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    openTime: input.openTime,
    closeTime: input.closeTime,
    slotDurationMinutes: input.slotDurationMinutes,
    slotOffsetMinutes: input.slotOffsetMinutes,
    isActive: input.isActive ?? true,
  };

  if (input.id) {
    await prisma.pitch.update({ where: { id: input.id }, data });
  } else {
    await prisma.pitch.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/pitches");
  return { success: true };
}

export async function deletePitch(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Yetkisiz işlem." };

  const activeBookings = await prisma.booking.count({
    where: {
      pitchId: id,
      status: { in: ["CONFIRMED", "PENDING"] },
      date: { gte: new Date() },
    },
  });

  if (activeBookings > 0) {
    return { error: "Bu sahada aktif rezervasyonlar var. Önce pasife alın." };
  }

  await prisma.pitch.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/pitches");
  return { success: true };
}

export async function togglePitchActive(id: string, isActive: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Yetkisiz işlem." };

  await prisma.pitch.update({ where: { id }, data: { isActive } });

  revalidatePath("/");
  revalidatePath("/admin/pitches");
  return { success: true };
}
