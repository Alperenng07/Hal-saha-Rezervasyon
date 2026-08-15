"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createTenant,
  createTenantsBulk,
  listTenantsForPlatform,
  setTenantActive,
} from "@/lib/actions/tenants";
import { DEFAULT_PITCH_TEMPLATE } from "@/lib/default-pitch-template";
import { tenantPaths } from "@/lib/tenant-paths";
import { signOutPlatform } from "@/lib/actions/platform-auth";

type TenantRow = Awaited<ReturnType<typeof listTenantsForPlatform>>[number];

function readPitchTemplate(form: FormData) {
  return {
    name: (form.get("pitchName") as string) || undefined,
    openTime: (form.get("openTime") as string) || undefined,
    closeTime: (form.get("closeTime") as string) || undefined,
    slotDurationMinutes: Number(form.get("slotDurationMinutes") || 60),
  };
}

export default function PlatformDashboard() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
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
        themeColor: (form.get("themeColor") as string) || undefined,
        pitchTemplate: readPitchTemplate(form),
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

  const handleBulkCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBulkResult(null);
    setError(null);
    const form = new FormData(e.currentTarget);
    const bulkText = form.get("bulkText") as string;

    startTransition(async () => {
      const result = await createTenantsBulk(bulkText, readPitchTemplate(form));

      if ("error" in result) {
        setError(result.error);
        return;
      }

      const summary = [
        `${result.created.length} işletme oluşturuldu.`,
        result.failed.length > 0
          ? `${result.failed.length} satır başarısız: ${result.failed
              .slice(0, 3)
              .map((f) => f.error)
              .join("; ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" ");

      setBulkResult(summary);
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
          <h2 className="text-lg font-bold text-slate-900 mb-1">Yeni İşletme Ekle</h2>
          <p className="text-sm text-slate-500 mb-4">
            Oluşturulunca varsayılan saha otomatik eklenir — hemen rezervasyona açılır.
          </p>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="name"
                required
                placeholder="İşletme adı"
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
              <input
                name="slug"
                placeholder="URL kodu (opsiyonel)"
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
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Varsayılan saha şablonu</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input
                  name="pitchName"
                  defaultValue={DEFAULT_PITCH_TEMPLATE.name}
                  placeholder="Saha adı"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  name="openTime"
                  defaultValue={DEFAULT_PITCH_TEMPLATE.openTime}
                  placeholder="Açılış"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  name="closeTime"
                  defaultValue={DEFAULT_PITCH_TEMPLATE.closeTime}
                  placeholder="Kapanış"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  name="slotDurationMinutes"
                  type="number"
                  min={15}
                  max={240}
                  defaultValue={DEFAULT_PITCH_TEMPLATE.slotDurationMinutes}
                  placeholder="Seans dk"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm disabled:opacity-60"
            >
              {isPending ? "Ekleniyor..." : "İşletme Oluştur"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Toplu İşletme Ekle</h2>
          <p className="text-sm text-slate-500 mb-4">
            Her satır: <code className="bg-slate-100 px-1 rounded">İşletme Adı, url-kodu, admin@email.com</code>
            <br />
            URL kodu opsiyonel — boş bırakılırsa isimden üretilir.
          </p>
          <form onSubmit={handleBulkCreate} className="space-y-4">
            <textarea
              name="bulkText"
              rows={6}
              placeholder={`Yeşil Saha, yesil-saha, admin1@mail.com\nMavi Halı, , admin2@mail.com`}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                name="pitchName"
                defaultValue={DEFAULT_PITCH_TEMPLATE.name}
                placeholder="Saha adı"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="openTime"
                defaultValue={DEFAULT_PITCH_TEMPLATE.openTime}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="closeTime"
                defaultValue={DEFAULT_PITCH_TEMPLATE.closeTime}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="slotDurationMinutes"
                type="number"
                min={15}
                max={240}
                defaultValue={DEFAULT_PITCH_TEMPLATE.slotDurationMinutes}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-sm disabled:opacity-60"
            >
              {isPending ? "İçe aktarılıyor..." : "Toplu Oluştur"}
            </button>
          </form>
          {bulkResult && <p className="mt-3 text-sm text-emerald-700">{bulkResult}</p>}
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
