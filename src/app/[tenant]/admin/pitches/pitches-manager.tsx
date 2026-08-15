"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { savePitch, deletePitch } from "@/lib/actions/pitches";

type Pitch = {
  id: string;
  name: string;
  description: string | null;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  slotOffsetMinutes: number;
  isActive: boolean;
};

export default function PitchesManager({
  tenantSlug,
  initialPitches,
}: {
  tenantSlug: string;
  initialPitches: Pitch[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<Pitch | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await savePitch(tenantSlug, {
        id: editingPitch?.id,
        name: form.get("name") as string,
        description: (form.get("description") as string) || undefined,
        openTime: form.get("openTime") as string,
        closeTime: form.get("closeTime") as string,
        slotDurationMinutes: Number(form.get("slotDurationMinutes")),
        slotOffsetMinutes: Number(form.get("slotOffsetMinutes")),
        isActive: form.get("isActive") === "on",
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setIsModalOpen(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bu sahayı silmek istediğinize emin misiniz?")) return;

    startTransition(async () => {
      const result = await deletePitch(tenantSlug, id);
      if ("error" in result) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sahalar & Saatler</h1>
          <p className="text-slate-500 mt-1 text-sm">Sahalarınızı ve çalışma saatlerini yönetin.</p>
        </div>
        <button
          onClick={() => {
            setEditingPitch(null);
            setError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors w-full sm:w-auto"
        >
          <Plus size={18} />
          Yeni Saha Ekle
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="md:hidden divide-y divide-slate-100">
          {initialPitches.length === 0 ? (
            <p className="py-8 px-4 text-center text-slate-500">Henüz saha eklenmemiş.</p>
          ) : (
            initialPitches.map((pitch) => (
              <div key={pitch.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{pitch.name}</p>
                    <p className="text-sm text-slate-600">
                      {pitch.openTime} – {pitch.closeTime}
                    </p>
                    <p className="text-xs text-slate-400">
                      {pitch.slotDurationMinutes} dk · Ofset {pitch.slotOffsetMinutes} dk
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                      pitch.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {pitch.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPitch(pitch);
                      setError(null);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 px-3 py-2.5 text-blue-700 bg-blue-50 rounded-lg text-sm font-semibold"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(pitch.id)}
                    disabled={isPending}
                    className="flex-1 px-3 py-2.5 text-red-700 bg-red-50 rounded-lg text-sm font-semibold"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[640px]">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-4 px-6 font-medium">Saha Adı</th>
              <th className="py-4 px-6 font-medium">Çalışma Saatleri</th>
              <th className="py-4 px-6 font-medium">Seans & Ofset</th>
              <th className="py-4 px-6 font-medium">Durum</th>
              <th className="py-4 px-6 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {initialPitches.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 px-6 text-center text-slate-500">
                  Henüz saha eklenmemiş.
                </td>
              </tr>
            ) : (
              initialPitches.map((pitch) => (
                <tr key={pitch.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-4 px-6 font-medium text-slate-800">{pitch.name}</td>
                  <td className="py-4 px-6 text-slate-600">
                    {pitch.openTime} - {pitch.closeTime}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {pitch.slotDurationMinutes} dk (Ofset: {pitch.slotOffsetMinutes} dk)
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pitch.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}`}
                    >
                      {pitch.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingPitch(pitch);
                        setError(null);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(pitch.id)}
                      disabled={isPending}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                {editingPitch ? "Sahayı Düzenle" : "Yeni Saha Ekle"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Saha Adı</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={editingPitch?.name}
                  required
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                <input
                  name="description"
                  type="text"
                  defaultValue={editingPitch?.description ?? ""}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Açılış</label>
                  <input
                    name="openTime"
                    type="time"
                    defaultValue={editingPitch?.openTime || "12:00"}
                    required
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kapanış</label>
                  <input
                    name="closeTime"
                    type="time"
                    defaultValue={editingPitch?.closeTime || "04:00"}
                    required
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seans (dk)</label>
                  <select
                    name="slotDurationMinutes"
                    defaultValue={editingPitch?.slotDurationMinutes || 60}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                    <option value={90}>90</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ofset (dk)</label>
                  <select
                    name="slotOffsetMinutes"
                    defaultValue={editingPitch?.slotOffsetMinutes || 0}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={0}>0</option>
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={45}>45</option>
                  </select>
                </div>
              </div>

              {editingPitch && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    name="isActive"
                    type="checkbox"
                    defaultChecked={editingPitch.isActive}
                    className="rounded border-slate-300"
                  />
                  Aktif saha
                </label>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isPending ? "Kaydediliyor..." : editingPitch ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
