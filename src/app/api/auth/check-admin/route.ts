import { NextResponse } from "next/server";
import { getSessionUser, resolveIsAdmin, syncUserFromSession } from "@/lib/auth";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ isAdmin: false });
  }

  await syncUserFromSession();
  const isAdmin = await resolveIsAdmin(sessionUser.email);
  return NextResponse.json({ isAdmin });
}
