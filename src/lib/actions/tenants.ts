"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin, syncTenantAdminRole } from "@/lib/auth";
import { normalizePitchTemplate, type PitchTemplateInput } from "@/lib/default-pitch-template";
import { isValidTheme } from "@/lib/themes";
import {
  isValidTenantSlug,
  slugifyTenantName,
  tenantPaths,
} from "@/lib/tenant-paths";
import { ensureUniqueTenantSlug } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true; slug: string } | { error: string };

type CreateTenantInput = {
  name: string;
  slug?: string;
  siteTitle?: string;
  adminEmail: string;
  phone?: string;
  email?: string;
  themeColor?: string;
  pitchTemplate?: PitchTemplateInput;
};

async function createTenantRecord(input: CreateTenantInput): Promise<ActionResult> {
  const name = input.name.trim();
  const adminEmail = input.adminEmail.trim().toLowerCase();
  if (!name) return { error: "İşletme adı zorunludur." };
  if (!adminEmail) return { error: "Admin e-postası zorunludur." };

  const baseSlug = slugifyTenantName(input.slug?.trim() || name);
  if (!baseSlug || !isValidTenantSlug(baseSlug)) {
    return { error: "Geçerli bir URL kodu girin (ör. abc-halisaha)." };
  }

  const pitchTemplate = normalizePitchTemplate(input.pitchTemplate);
  if ("error" in pitchTemplate && pitchTemplate.error) {
    return { error: pitchTemplate.error };
  }
  if (!("data" in pitchTemplate)) {
    return { error: "Varsayılan saha şablonu geçersiz." };
  }

  const slug = await ensureUniqueTenantSlug(baseSlug);
  const themeColor = isValidTheme(input.themeColor) ? input.themeColor : "emerald";

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
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

    await tx.pitch.create({
      data: {
        tenantId: tenant.id,
        ...pitchTemplate.data,
      },
    });
  });

  await syncTenantAdminRole(adminEmail);

  revalidatePath("/platform");
  revalidatePath(tenantPaths(slug).site);
  revalidatePath(tenantPaths(slug).admin);
  return { success: true, slug };
}

export async function createTenant(input: CreateTenantInput): Promise<ActionResult> {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) return { error: "Yetkisiz işlem." };
  return createTenantRecord(input);
}

export type BulkCreateResult =
  | { success: true; created: string[]; failed: { line: string; error: string }[] }
  | { error: string };

export async function createTenantsBulk(
  rawText: string,
  pitchTemplate?: PitchTemplateInput
): Promise<BulkCreateResult> {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) return { error: "Yetkisiz işlem." };

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { error: "En az bir satır girin." };
  }
  if (lines.length > 50) {
    return { error: "Tek seferde en fazla 50 işletme eklenebilir." };
  }

  const created: string[] = [];
  const failed: { line: string; error: string }[] = [];

  for (const line of lines) {
    const parts = line.split(/[,;\t|]/).map((part) => part.trim()).filter(Boolean);

    if (parts.length < 2) {
      failed.push({ line, error: "Format: İşletme Adı, admin@email.com veya Ad, slug, admin@email.com" });
      continue;
    }

    const name = parts[0];
    let slug: string | undefined;
    let adminEmail: string;

    if (parts.length === 2) {
      adminEmail = parts[1];
    } else {
      slug = parts[1];
      adminEmail = parts[2];
    }

    if (!name || !adminEmail.includes("@")) {
      failed.push({ line, error: "Geçerli işletme adı ve admin e-postası girin." });
      continue;
    }

    const result = await createTenantRecord({
      name,
      slug,
      adminEmail,
      pitchTemplate,
    });

    if ("error" in result) {
      failed.push({ line, error: result.error });
    } else {
      created.push(result.slug);
    }
  }

  revalidatePath("/platform");
  return { success: true, created, failed };
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
