import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import { getTenantSettings } from "@/lib/data";
import { getThemeClass } from "@/lib/themes";
import { tenantPaths } from "@/lib/tenant";

type Props = {
  params: Promise<{ tenant: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant: tenantSlug } = await params;
  const settings = await getTenantSettings(tenantSlug);
  if (!settings) {
    return { title: "İşletme bulunamadı" };
  }
  return {
    title: settings.siteTitle,
    description: `${settings.name} rezervasyon ve yönetim sistemi.`,
  };
}

export default async function TenantLayout({ params, children }: Props) {
  const { tenant: tenantSlug } = await params;
  const settings = await getTenantSettings(tenantSlug);
  if (!settings) notFound();

  const themeClass = getThemeClass(settings.themeColor);
  const paths = tenantPaths(tenantSlug);

  return (
    <div className={`min-h-screen flex flex-col site-themed ${themeClass} overflow-x-hidden`}>
      <Navbar tenantSlug={tenantSlug} settings={settings} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-4 sm:py-6 mt-auto">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-center sm:text-left">
          <p className="text-slate-500">© {new Date().getFullYear()} {settings.name}</p>
          <Link href={paths.login} className="font-semibold link-brand">
            İşletme Yönetim Paneli →
          </Link>
        </div>
      </footer>
    </div>
  );
}
