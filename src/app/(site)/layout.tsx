import type { Metadata } from "next";
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
    </div>
  );
}
