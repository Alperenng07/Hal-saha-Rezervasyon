"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTenant, listTenantsForPlatform, setTenantActive } from "@/lib/actions/tenants";
import { tenantPaths } from "@/lib/tenant-paths";
import { signOutPlatform } from "@/lib/actions/platform-auth";

type TenantRow = Awaited<ReturnType<typeof listTenantsForPlatform>>[number];

export default function PlatformDashboard() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadTenants = () => {
    startTransition(async () => {
      const rows = await listTenantsForPlatform();
      setTenants(rows);
    });
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createTenant({
        name: form.get("name") as string,
        slug: (form.get("slug") as string) || undefined,
        adminEmail: form.get("adminEmail") as string,
        phone: (form.get("phone") as string) || undefined,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      (e.target as HTMLFormElement).reset();
      loadTenants();
      router.refresh();
    });
  };

  const toggleActive = (tenantId: string, isActive: boolean) => {
    startTransition(async () => {
      await setTenantActive(tenantId, isActive);
      loadTenants();
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Platform Yönetimi</h1>
          <p className="text-sm text-slate-400">Tüm işletmeler tek veritabanında</p>
        </div>
        <form action={signOutPlatform}>
          <button type="submit" className="text-sm text-slate-300 hover:text-white">
            Çıkış
          </button>
        </form>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Yeni İşletme Ekle</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="name"
              required
              placeholder="İşletme adı"
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
            <input
              name="slug"
              placeholder="URL kodu (opsiyonel, örn: abc-halisaha)"
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
            <input
              name="adminEmail"
              type="email"
              required
              placeholder="Admin e-postası"
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
            <input
              name="phone"
              placeholder="Telefon (opsiyonel)"
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm disabled:opacity-60"
              >
                {isPending ? "Ekleniyor..." : "İşletme Oluştur"}
              </button>
            </div>
          </form>
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Admin e-postası Supabase&apos;de kayıtlı olmalıdır. İşletme linki:{" "}
            <code className="bg-slate-100 px-1 rounded">/isletme-kodu</code>
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <h2 className="text-lg font-bold text-slate-900 p-5 sm:p-6 border-b border-slate-100">
            İşletmeler ({tenants.length})
          </h2>
          {tenants.length === 0 ? (
            <p className="p-6 text-slate-500 text-sm">Henüz işletme yok.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {tenants.map((tenant) => {
                const paths = tenantPaths(tenant.slug);
                return (
                  <div
                    key={tenant.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{tenant.name}</p>
                      <p className="text-sm text-slate-500 truncate">
                        /{tenant.slug} · {tenant.adminEmail ?? "admin yok"} ·{" "}
                        {tenant._count.pitches} saha
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={paths.site}
                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        Site
                      </Link>
                      <Link
                        href={paths.admin}
                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        Admin
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleActive(tenant.id, !tenant.isActive)}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          tenant.isActive
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {tenant.isActive ? "Pasifleştir" : "Aktifleştir"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
