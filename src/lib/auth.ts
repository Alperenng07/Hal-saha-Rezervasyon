import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { getActiveTenantBySlug, getTenantBySlug } from "@/lib/tenant";
import type { Role, Tenant } from "@prisma/client";

const DEFAULT_SUPER_ADMIN_EMAIL = "alperenguduk20@gmail.com";

function getEnvSuperAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS || process.env.ADMIN_EMAILS || DEFAULT_SUPER_ADMIN_EMAIL)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function resolveIsSuperAdmin(email: string): Promise<boolean> {
  const normalized = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { role: true },
  });
  if (user?.role === "SUPER_ADMIN") return true;
  return getEnvSuperAdminEmails().includes(normalized);
}

export async function resolveIsTenantAdmin(email: string, tenant: Tenant): Promise<boolean> {
  const normalized = email.toLowerCase();
  if (await resolveIsSuperAdmin(normalized)) return true;
  return tenant.adminEmail?.toLowerCase() === normalized;
}

export async function syncSuperAdminRole(email: string) {
  const normalized = email.toLowerCase();
  const isSuper = getEnvSuperAdminEmails().includes(normalized);

  if (isSuper) {
    await prisma.user.updateMany({
      where: { email: normalized },
      data: { role: "SUPER_ADMIN" },
    });
  }
}

export async function syncTenantAdminRole(adminEmail: string) {
  const normalized = adminEmail.toLowerCase();

  const adminUser = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (adminUser && adminUser.role === "USER") {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: "ADMIN" },
    });
  }
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUser() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  return prisma.user.findUnique({
    where: { supabaseId: sessionUser.id },
  });
}

export async function syncUserFromSession() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) return null;

  const normalized = sessionUser.email.toLowerCase();
  const isSuper = await resolveIsSuperAdmin(normalized);
  const role: Role = isSuper ? "SUPER_ADMIN" : "USER";

  const user = await prisma.user.upsert({
    where: { supabaseId: sessionUser.id },
    create: {
      supabaseId: sessionUser.id,
      email: normalized,
      name: (sessionUser.user_metadata?.name as string) || null,
      role,
    },
    update: {
      email: normalized,
      name: (sessionUser.user_metadata?.name as string) || undefined,
      role: isSuper ? "SUPER_ADMIN" : undefined,
    },
  });

  if (isSuper) {
    await syncSuperAdminRole(normalized);
  }

  return user;
}

export async function requireSuperAdmin() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) return null;
  if (!(await resolveIsSuperAdmin(sessionUser.email))) return null;
  await syncUserFromSession();
  return getCurrentUser();
}

export async function requireTenantAdmin(tenantSlug: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) return null;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant || !tenant.isActive) return null;

  if (!(await resolveIsTenantAdmin(sessionUser.email, tenant))) return null;

  await syncUserFromSession();
  const user = await getCurrentUser();
  if (!user) return null;

  return { user, tenant };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

/** @deprecated Use requireTenantAdmin(slug) */
export async function requireAdmin() {
  return requireSuperAdmin();
}

/** @deprecated Use resolveIsTenantAdmin with tenant context */
export async function resolveIsAdmin(email: string): Promise<boolean> {
  return resolveIsSuperAdmin(email);
}

export async function getAdminEmailFromTenant(tenantSlug: string): Promise<string | null> {
  const tenant = await getActiveTenantBySlug(tenantSlug);
  return tenant?.adminEmail?.toLowerCase() ?? null;
}
