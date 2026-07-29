import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";

const DEFAULT_ADMIN_EMAIL = "alperenguduk20@gmail.com";

function getEnvAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAIL)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminEmailFromSettings(): Promise<string | null> {
  const settings = await prisma.businessSettings.findFirst({
    select: { adminEmail: true },
  });
  return settings?.adminEmail?.toLowerCase() ?? null;
}

export async function resolveIsAdmin(email: string): Promise<boolean> {
  const normalized = email.toLowerCase();
  const envAdmins = getEnvAdminEmails();
  if (envAdmins.includes(normalized)) return true;

  const dbAdmin = await getAdminEmailFromSettings();
  return dbAdmin ? normalized === dbAdmin : false;
}

export async function syncAdminRoles(adminEmail: string) {
  const normalized = adminEmail.toLowerCase();

  await prisma.user.updateMany({
    where: { role: "ADMIN", email: { not: normalized } },
    data: { role: "USER" },
  });

  const adminUser = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (adminUser && adminUser.role !== "ADMIN") {
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

  const isAdmin = await resolveIsAdmin(sessionUser.email);
  const role: Role = isAdmin ? "ADMIN" : "USER";

  return prisma.user.upsert({
    where: { supabaseId: sessionUser.id },
    create: {
      supabaseId: sessionUser.id,
      email: sessionUser.email,
      name: (sessionUser.user_metadata?.name as string) || null,
      role,
    },
    update: {
      email: sessionUser.email,
      name: (sessionUser.user_metadata?.name as string) || undefined,
      role,
    },
  });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return null;
  }
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}
