import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { getBusinessSettings } from "@/lib/data";
import { getThemeClass } from "@/lib/themes";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();
  return {
    title: settings?.siteTitle ?? "Halı Saha Rezervasyon",
    description: settings
      ? `${settings.name} rezervasyon ve yönetim sistemi.`
      : "Online halı saha rezervasyon sistemi.",
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getBusinessSettings();
  const themeClass = getThemeClass(settings?.themeColor);

  return (
    <div className={`min-h-screen flex flex-col site-themed ${themeClass} overflow-x-hidden`}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-4 sm:py-6 mt-auto">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-center sm:text-left">
          <p className="text-slate-500">© {new Date().getFullYear()} Halı Saha Rezervasyon</p>
          <Link
            href="/login"
            className="font-semibold link-brand"
          >
            İşletme Yönetim Paneli →
          </Link>
        </div>
      </footer>
    </div>
  );
}
