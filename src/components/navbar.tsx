import Link from "next/link";
import { getBusinessSettings } from "@/lib/data";

export default async function Navbar() {
  const settings = await getBusinessSettings();
  const businessName = settings?.name ?? "Halı Saha";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center">
        <Link href="/" className="flex items-center gap-3 group">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={businessName}
              className="h-10 w-10 object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              {businessName.charAt(0)}
            </div>
          )}
          <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">
            {businessName}
          </span>
        </Link>
      </div>
    </nav>
  );
}
