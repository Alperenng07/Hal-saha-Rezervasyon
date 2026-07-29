import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import { getBusinessSettings } from "@/lib/data";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBusinessSettings();
  return {
    title: settings?.siteTitle ?? "Halı Saha Rezervasyon",
    description: settings
      ? `${settings.name} rezervasyon ve yönetim sistemi.`
      : "Online halı saha rezervasyon sistemi.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-slate-50 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
