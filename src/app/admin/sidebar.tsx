"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  CalendarRange,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncUserAction } from "@/lib/actions/auth";

type SidebarProps = {
  adminName: string | null;
  adminEmail: string;
};

export default function Sidebar({ adminName, adminEmail }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const navLinks = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/calendar", icon: CalendarRange, label: "Takvim" },
    { href: "/admin/bookings", icon: CalendarCheck, label: "Rezervasyonlar" },
    { href: "/admin/subscriptions", icon: Users, label: "Abonelikler" },
    { href: "/admin/pitches", icon: CalendarDays, label: "Sahalar" },
    { href: "/admin/settings", icon: Settings, label: "Ayarlar" },
  ];

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    await syncUserAction();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-slate-900 text-white rounded-md shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          onClick={closeSidebar}
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out pb-20 md:pb-0 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-tight">Yönetim Paneli</h2>
          <p className="text-sm text-slate-400 mt-1">Saha & Rezervasyon</p>
        </div>

        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-800/60">
            <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {adminName || "Yönetici"}
              </p>
              <p className="text-xs text-slate-400 truncate">{adminEmail}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <span className="font-medium">Siteye Dön</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 safe-area-pb">
        <div className="grid grid-cols-5 gap-1 px-1 py-1.5">
          {[
            { href: "/admin/calendar", icon: CalendarRange, label: "Takvim" },
            { href: "/admin/bookings", icon: CalendarCheck, label: "Rezerv." },
            { href: "/admin", icon: LayoutDashboard, label: "Panel" },
            { href: "/admin/subscriptions", icon: Users, label: "Abone" },
            { href: "/admin/settings", icon: Settings, label: "Ayarlar" },
          ].map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-[10px] font-semibold ${
                  isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-500"
                }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
