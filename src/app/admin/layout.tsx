import { redirect } from "next/navigation";
import Sidebar from "./sidebar";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="flex h-[100dvh] bg-slate-100 overflow-hidden relative">
      <Sidebar adminName={admin.name} adminEmail={admin.email} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full min-w-0 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <div className="p-2.5 sm:p-4 md:p-8 pt-14 md:pt-8 max-w-7xl mx-auto min-w-0">{children}</div>
      </main>
    </div>
  );
}
