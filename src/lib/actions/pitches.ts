"use server";

import prisma from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/auth";
import { tenantPaths } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { error: string };

export async function getAllPitchesAdmin(tenantSlug: string) {
  const ctx = await requireTenantAdmin(tenantSlug);
  if (!ctx) return [];

  return prisma.pitch.findMany({
    where: { tenantId: ctx.tenant.id },
    orderBy: { createdAt: "asc" },
  });
}

export async function savePitch(
  tenantSlug: string,
  input: {
    id?: string;
    name: string;
    description?: string;
    openTime: string;
    closeTime: string;
    slotDurationMinutes: number;
    slotOffsetMinutes: number;
    isActive?: boolean;
  }
): Promise<ActionResult> {
  const ctx = await requireTenantAdmin(tenantSlug);
  if (!ctx) return { error: "Yetkisiz işlem." };

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
    const existing = await prisma.pitch.findFirst({
      where: { id: input.id, tenantId: ctx.tenant.id },
    });
    if (!existing) return { error: "Saha bulunamadı." };
    await prisma.pitch.update({ where: { id: input.id }, data });
  } else {
    await prisma.pitch.create({
      data: { ...data, tenantId: ctx.tenant.id },
    });
  }

  const paths = tenantPaths(tenantSlug);
  revalidatePath(paths.site);
  revalidatePath(paths.admin);
  revalidatePath(paths.pitches);
  return { success: true };
}

export async function deletePitch(tenantSlug: string, id: string): Promise<ActionResult> {
  const ctx = await requireTenantAdmin(tenantSlug);
  if (!ctx) return { error: "Yetkisiz işlem." };

  const pitch = await prisma.pitch.findFirst({
    where: { id, tenantId: ctx.tenant.id },
  });
  if (!pitch) return { error: "Saha bulunamadı." };

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

  const paths = tenantPaths(tenantSlug);
  revalidatePath(paths.site);
  revalidatePath(paths.admin);
  revalidatePath(paths.pitches);
  return { success: true };
}

export async function togglePitchActive(
  tenantSlug: string,
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const ctx = await requireTenantAdmin(tenantSlug);
  if (!ctx) return { error: "Yetkisiz işlem." };

  const pitch = await prisma.pitch.findFirst({
    where: { id, tenantId: ctx.tenant.id },
  });
  if (!pitch) return { error: "Saha bulunamadı." };

  await prisma.pitch.update({ where: { id }, data: { isActive } });

  const paths = tenantPaths(tenantSlug);
  revalidatePath(paths.site);
  revalidatePath(paths.pitches);
  return { success: true };
}
