"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check } from "lucide-react";
import { updateBusinessSettings } from "@/lib/actions/settings";
import { THEME_OPTIONS, type ThemeId } from "@/lib/themes";

type Settings = {
  name: string;
  siteTitle: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  adminEmail: string | null;
  themeColor: string | null;
};

export default function SettingsForm({ settings }: { settings: Settings | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(
    (settings?.themeColor as ThemeId) || "emerald"
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateBusinessSettings({
        name: form.get("name") as string,
        siteTitle: form.get("siteTitle") as string,
        logoUrl: (form.get("logoUrl") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
        email: (form.get("email") as string) || undefined,
        adminEmail: form.get("adminEmail") as string,
        themeColor: selectedTheme,
      });

      if ("error" in result) {
        alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">İşletme Ayarları</h1>
        <p className="text-slate-500 mt-1">Marka, tema, iletişim ve yönetici bilgilerinizi yönetin.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Site Teması</h3>
            <p className="text-sm text-slate-500">
              Ziyaretçilerin gördüğü sitenin ana rengini seçin. Butonlar, takvim ve vurgular bu renge göre
              güncellenir.
            </p>
            <input type="hidden" name="themeColor" value={selectedTheme} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer touch-manipulation active:scale-[0.97] ${
                      isSelected
                        ? "border-slate-800 bg-slate-50 shadow-md"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className="h-10 w-10 rounded-full shadow-inner ring-2 ring-white"
                      style={{
                        background: `linear-gradient(135deg, ${theme.color}, ${theme.color}99)`,
                      }}
                    />
                    <span className="text-sm font-semibold text-slate-700">{theme.label}</span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-slate-800 text-white flex items-center justify-center">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Marka Bilgileri</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İşletme Adı</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={settings?.name ?? ""}
                  required
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 ring-brand transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site Başlığı</label>
                <input
                  name="siteTitle"
                  type="text"
                  defaultValue={settings?.siteTitle ?? ""}
                  required
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 ring-brand transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
              <input
                name="logoUrl"
                type="url"
                defaultValue={settings?.logoUrl ?? ""}
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 ring-brand transition-shadow"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Yönetici</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admin E-postası</label>
              <input
                name="adminEmail"
                type="email"
                defaultValue={settings?.adminEmail ?? "alperenguduk20@gmail.com"}
                required
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 ring-brand transition-shadow"
                placeholder="admin@example.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                Bu e-posta ile kayıtlı kullanıcı yönetim paneline erişebilir.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">İletişim</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={settings?.phone ?? ""}
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 ring-brand transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  İletişim E-postası
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={settings?.email ?? ""}
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 ring-brand transition-shadow"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-60 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Save size={18} />
              {isPending ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
