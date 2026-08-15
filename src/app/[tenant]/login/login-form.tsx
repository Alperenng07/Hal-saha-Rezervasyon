"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { syncUserAction } from "@/lib/actions/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { tenantPaths } from "@/lib/tenant-paths";
import { Button } from "@/components/ui/button";

export default function LoginForm({
  tenantSlug,
  adminEmail,
  businessName,
}: {
  tenantSlug: string;
  adminEmail: string | null;
  businessName: string;
}) {
  const router = useRouter();
  const paths = tenantPaths(tenantSlug);
  const [email, setEmail] = useState(adminEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      await syncUserAction();

      const res = await fetch(
        `/api/auth/check-admin?tenant=${encodeURIComponent(tenantSlug)}`
      );
      const { isAdmin } = await res.json();

      if (!isAdmin) {
        await supabase.auth.signOut();
        setError("Bu hesap bu işletmenin yöneticisi değil.");
        return;
      }

      router.push(paths.admin);
      router.refresh();
    } catch {
      setError("Giriş yapılamadı. Supabase ayarlarını kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {businessName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Yönetim paneline erişmek için işletme admin hesabınızla giriş yapın.
          </p>
          {adminEmail && (
            <p className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
              Kayıtlı admin:{" "}
              <span className="font-semibold text-slate-800">{adminEmail}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              placeholder={adminEmail ?? "ornek@email.com"}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800"
          >
            {loading ? "Giriş yapılıyor..." : "Yönetim Paneline Gir"}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link href={paths.site} className="text-sm text-slate-400 hover:text-slate-600">
            ← Rezervasyon sayfasına dön
          </Link>
        </p>
      </div>
    </div>
  );
}
