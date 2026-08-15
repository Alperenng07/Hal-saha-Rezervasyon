"use server";

import prisma from "@/lib/prisma";
import { requireTenantAdmin, syncTenantAdminRole } from "@/lib/auth";
import { isValidTheme } from "@/lib/themes";
import { getTenantBySlug, tenantPaths } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { error: string };

export async function updateTenantSettings(
  tenantSlug: string,
  input: {
    name: string;
    siteTitle: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    adminEmail?: string;
    themeColor?: string;
    notifyEmailOnBooking?: boolean;
    notifyWhatsAppOnBooking?: boolean;
    whatsappApiKey?: string;
  }
): Promise<ActionResult> {
  const ctx = await requireTenantAdmin(tenantSlug);
  if (!ctx) return { error: "Yetkisiz işlem." };

  const adminEmail = input.adminEmail?.trim().toLowerCase();
  if (!adminEmail) {
    return { error: "Admin e-postası zorunludur." };
  }

  const themeColor = isValidTheme(input.themeColor) ? input.themeColor : "emerald";

  await prisma.tenant.update({
    where: { id: ctx.tenant.id },
    data: {
      name: input.name.trim(),
      siteTitle: input.siteTitle.trim(),
      logoUrl: input.logoUrl?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      adminEmail,
      themeColor,
      notifyEmailOnBooking: input.notifyEmailOnBooking ?? true,
      notifyWhatsAppOnBooking: input.notifyWhatsAppOnBooking ?? false,
      whatsappApiKey: input.whatsappApiKey?.trim() || null,
    },
  });

  await syncTenantAdminRole(adminEmail);

  const paths = tenantPaths(tenantSlug);
  revalidatePath(paths.site);
  revalidatePath(paths.admin);
  revalidatePath(paths.settings);
  return { success: true };
}

export async function getTenantSettingsForAdmin(tenantSlug: string) {
  const ctx = await requireTenantAdmin(tenantSlug);
  if (!ctx) return null;
  return getTenantBySlug(tenantSlug);
}
