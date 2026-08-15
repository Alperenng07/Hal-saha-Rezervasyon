"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncUserAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default function PlatformLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
      const res = await fetch("/api/auth/check-admin");
      const { isAdmin } = await res.json();
      if (!isAdmin) {
        await supabase.auth.signOut();
        setError("Bu hesap platform yöneticisi değil.");
        return;
      }

      router.push("/platform");
      router.refresh();
    } catch {
      setError("Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Platform Girişi</h1>
        <p className="text-sm text-slate-500 text-center mt-2 mb-6">
          Tüm işletmeleri yönetmek için super admin hesabınızla giriş yapın.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? "Giriş..." : "Platforma Gir"}
          </Button>
        </form>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Ana sayfa
          </Link>
        </p>
      </div>
    </div>
  );
}
