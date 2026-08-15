import { redirect } from "next/navigation";
import Sidebar from "./sidebar";
import { requireTenantAdmin } from "@/lib/auth";
import { tenantPaths } from "@/lib/tenant";

type Props = {
  params: Promise<{ tenant: string }>;
  children: React.ReactNode;
};

export default async function AdminLayout({ params, children }: Props) {
  const { tenant: tenantSlug } = await params;
  const ctx = await requireTenantAdmin(tenantSlug);
  if (!ctx) {
    redirect(`${tenantPaths(tenantSlug).login}?redirect=${tenantPaths(tenantSlug).admin}`);
  }

  return (
    <div className="flex h-[100dvh] bg-slate-100 overflow-hidden relative">
      <Sidebar
        tenantSlug={tenantSlug}
        adminName={ctx.user.name}
        adminEmail={ctx.user.email}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full min-w-0 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <div className="p-2.5 sm:p-4 md:p-8 pt-14 md:pt-8 max-w-7xl mx-auto min-w-0">{children}</div>
      </main>
    </div>
  );
}
