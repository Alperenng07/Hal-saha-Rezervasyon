import { NextResponse } from "next/server";
import {
  getSessionUser,
  resolveIsSuperAdmin,
  resolveIsTenantAdmin,
  syncUserFromSession,
} from "@/lib/auth";
import { getActiveTenantBySlug } from "@/lib/tenant";

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ isAdmin: false });
  }

  await syncUserFromSession();

  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (tenantSlug) {
    const tenant = await getActiveTenantBySlug(tenantSlug);
    if (!tenant) return NextResponse.json({ isAdmin: false });
    const isAdmin = await resolveIsTenantAdmin(sessionUser.email, tenant);
    return NextResponse.json({ isAdmin });
  }

  const isAdmin = await resolveIsSuperAdmin(sessionUser.email);
  return NextResponse.json({ isAdmin });
}
