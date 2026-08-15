import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import PlatformDashboard from "./platform-dashboard";

export default async function PlatformPage() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    redirect("/platform/login");
  }

  return <PlatformDashboard />;
}
