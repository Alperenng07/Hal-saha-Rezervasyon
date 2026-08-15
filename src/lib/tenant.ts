import prisma from "@/lib/prisma";
import {
  isValidTenantSlug,
  slugifyTenantName,
  RESERVED_TENANT_SLUGS,
} from "@/lib/tenant-paths";

export {
  isValidTenantSlug,
  slugifyTenantName,
  RESERVED_TENANT_SLUGS,
  tenantPaths,
} from "@/lib/tenant-paths";

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function getActiveTenantBySlug(slug: string) {
  return prisma.tenant.findFirst({
    where: { slug, isActive: true },
  });
}

export async function getAllTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function ensureUniqueTenantSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}
