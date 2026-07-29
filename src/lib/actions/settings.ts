"use server";

import prisma from "@/lib/prisma";
import { requireAdmin, syncAdminRoles } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { error: string };

export async function updateBusinessSettings(input: {
  name: string;
  siteTitle: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  adminEmail?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Yetkisiz işlem." };

  const adminEmail = input.adminEmail?.trim().toLowerCase();
  if (!adminEmail) {
    return { error: "Admin e-postası zorunludur." };
  }

  const data = {
    name: input.name.trim(),
    siteTitle: input.siteTitle.trim(),
    logoUrl: input.logoUrl?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    adminEmail,
  };

  const existing = await prisma.businessSettings.findFirst();
  if (existing) {
    await prisma.businessSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.businessSettings.create({ data });
  }

  await syncAdminRoles(adminEmail);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  return { success: true };
}
