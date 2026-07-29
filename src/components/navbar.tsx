import Link from "next/link";
import { getBusinessSettings } from "@/lib/data";
import { getCurrentUser, getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function Navbar() {
  const [settings, dbUser, sessionUser] = await Promise.all([
    getBusinessSettings(),
    getCurrentUser(),
    getSessionUser(),
  ]);

  const businessName = settings?.name ?? "Halı Saha";
  const isLoggedIn = !!sessionUser;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
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
        <div className="flex items-center gap-6">
          {dbUser?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-emerald-600 hover:after:w-full after:transition-all after:duration-300"
            >
              Yönetim Paneli
            </Link>
          )}
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 hidden sm:inline">
                {dbUser?.name || sessionUser?.email}
              </span>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-bold bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95 ring-1 ring-slate-900/10"
            >
              Giriş Yap
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
