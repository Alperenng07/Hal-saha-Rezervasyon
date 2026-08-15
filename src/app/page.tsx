import Link from "next/link";
import { getAllTenants } from "@/lib/tenant";

export default async function HomePage() {
  const tenants = await getAllTenants().catch(() => []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Halı Saha Rezervasyon</h1>
          <Link
            href="/platform/login"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 shrink-0"
          >
            Platform →
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-8">
        <section className="text-center space-y-3">
          <p className="text-slate-600">
            Rezervasyon yapmak için işletmenizin linkini kullanın.
          </p>
          <p className="text-sm text-slate-500">
            Örnek: <code className="bg-white border px-2 py-0.5 rounded">/demo</code>
          </p>
        </section>

        {tenants.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            <h2 className="px-5 py-4 font-semibold text-slate-800">Aktif işletmeler</h2>
            {tenants
              .filter((t) => t.isActive)
              .map((tenant) => (
                <Link
                  key={tenant.id}
                  href={`/${tenant.slug}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{tenant.name}</span>
                  <span className="text-sm text-emerald-700">/{tenant.slug}</span>
                </Link>
              ))}
          </section>
        )}
      </main>
    </div>
  );
}
