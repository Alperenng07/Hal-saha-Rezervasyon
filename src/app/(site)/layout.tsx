import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { getBusinessSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();
  return {
    title: settings?.siteTitle ?? "Halı Saha Rezervasyon",
    description: settings
      ? `${settings.name} rezervasyon ve yönetim sistemi.`
      : "Online halı saha rezervasyon sistemi.",
  };
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200/80 bg-white/80 py-8 mt-auto">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Halı Saha Rezervasyon</p>
          <Link
            href="/login"
            className="font-medium text-slate-400 hover:text-emerald-600 transition-colors"
          >
            İşletme Yönetim Paneli →
          </Link>
        </div>
      </footer>
    </div>
  );
}
