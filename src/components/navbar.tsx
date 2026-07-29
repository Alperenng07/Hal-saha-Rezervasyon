import Link from "next/link";
import { getBusinessSettings } from "@/lib/data";

export default async function Navbar() {
  const settings = await getBusinessSettings();
  const businessName = settings?.name ?? "Halı Saha";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 h-14 sm:h-16 md:h-20 flex items-center">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={businessName}
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300 shrink-0">
              {businessName.charAt(0)}
            </div>
          )}
          <span className="font-extrabold text-lg sm:text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight truncate">
            {businessName}
          </span>
        </Link>
      </div>
    </nav>
  );
}
