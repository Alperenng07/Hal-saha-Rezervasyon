"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin, syncTenantAdminRole } from "@/lib/auth";
import { isValidTheme } from "@/lib/themes";
import {
  isValidTenantSlug,
  slugifyTenantName,
  tenantPaths,
} from "@/lib/tenant-paths";
import { ensureUniqueTenantSlug } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true; slug: string } | { error: string };

export async function createTenant(input: {
  name: string;
  slug?: string;
  siteTitle?: string;
  adminEmail: string;
  phone?: string;
  email?: string;
  themeColor?: string;
}): Promise<ActionResult> {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) return { error: "Yetkisiz işlem." };

  const name = input.name.trim();
  const adminEmail = input.adminEmail.trim().toLowerCase();
  if (!name) return { error: "İşletme adı zorunludur." };
  if (!adminEmail) return { error: "Admin e-postası zorunludur." };

  const baseSlug = slugifyTenantName(input.slug?.trim() || name);
  if (!baseSlug || !isValidTenantSlug(baseSlug)) {
    return { error: "Geçerli bir URL kodu girin (ör. abc-halisaha)." };
  }

  const slug = await ensureUniqueTenantSlug(baseSlug);
  const themeColor = isValidTheme(input.themeColor) ? input.themeColor : "emerald";

  await prisma.tenant.create({
    data: {
      slug,
      name,
      siteTitle: input.siteTitle?.trim() || `${name} - Online Rezervasyon`,
      adminEmail,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      themeColor,
    },
  });

  await syncTenantAdminRole(adminEmail);

  revalidatePath("/platform");
  return { success: true, slug };
}

export async function setTenantActive(
  tenantId: string,
  isActive: boolean
): Promise<{ success: true } | { error: string }> {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) return { error: "Yetkisiz işlem." };

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { isActive },
  });

  revalidatePath("/platform");
  revalidatePath(tenantPaths(tenant.slug).site);
  return { success: true };
}

export async function listTenantsForPlatform() {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) return [];

  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { pitches: true } },
    },
  });
}
