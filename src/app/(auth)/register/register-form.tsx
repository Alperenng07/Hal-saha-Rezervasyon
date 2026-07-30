"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncUserAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default function RegisterForm({ adminEmail }: { adminEmail: string | null }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(adminEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (adminEmail && email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
        setError(
          `Yalnızca kayıtlı admin e-postası ile hesap oluşturabilirsiniz: ${adminEmail}`
        );
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        await syncUserAction();
        window.location.href = "/admin";
        return;
      }

      setSuccess(
        "Kayıt başarılı! E-posta adresinize gelen onay linkine tıklayarak hesabınızı aktifleştirin."
      );
    } catch {
      setError("Kayıt olunamadı. Supabase ayarlarını kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            İşletme Hesabı Oluştur
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Yönetim paneli için işletme sahibi hesabı oluşturun.
          </p>
          {adminEmail && (
            <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Admin e-postası ayarlarda tanımlıdır. Kayıt için{" "}
              <span className="font-semibold">{adminEmail}</span> kullanın.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-slate-700">
              Ad Soyad
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Adınız Soyadınız"
            />
          </div>

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
              placeholder="ornek@email.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              placeholder="En az 6 karakter"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800"
          >
            {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
