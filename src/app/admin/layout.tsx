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
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      <Sidebar adminName={admin.name} adminEmail={admin.email} />
      <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
        <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
