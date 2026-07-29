"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserX } from "lucide-react";
import { createSubscription, deactivateSubscription } from "@/lib/actions/subscriptions";
import { generateSlots } from "@/lib/slots";

const WEEKDAYS = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 0, label: "Pazar" },
];

type Pitch = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  slotOffsetMinutes: number;
};

type Subscription = {
  id: string;
  pitchId: string;
  guestName: string | null;
  guestPhone: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  pitch: { name: string };
  user: { name: string | null; email: string; phone: string | null } | null;
};

function dayLabel(dayOfWeek: number) {
  return WEEKDAYS.find((d) => d.value === dayOfWeek)?.label ?? "—";
}

export default function SubscriptionsManager({
  initialSubscriptions,
  pitches,
}: {
  initialSubscriptions: Subscription[];
  pitches: Pitch[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPitchId, setSelectedPitchId] = useState(pitches[0]?.id ?? "");

  const selectedPitch = pitches.find((p) => p.id === selectedPitchId);
  const slotOptions = useMemo(
    () => (selectedPitch ? generateSlots(selectedPitch) : []),
    [selectedPitch]
  );

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const slotValue = form.get("slot") as string;
    const [startTime, endTime] = slotValue.split("|");

    startTransition(async () => {
      const result = await createSubscription({
        pitchId: form.get("pitchId") as string,
        dayOfWeek: Number(form.get("dayOfWeek")),
        startTime,
        endTime,
        startDate: form.get("startDate") as string,
        endDate: (form.get("endDate") as string) || undefined,
        guestName: form.get("guestName") as string,
        guestPhone: form.get("guestPhone") as string,
        notes: (form.get("notes") as string) || undefined,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setIsModalOpen(false);
      router.refresh();
    });
  };

  const handleDeactivate = (id: string) => {
    if (!confirm("Bu aboneliği sonlandırmak istediğinize emin misiniz?")) return;

    startTransition(async () => {
      const result = await deactivateSubscription(id);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Abonelikler</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Düzenli aboneleri tanımlayın; ilgili saatler takvimde otomatik kapanır.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          disabled={pitches.length === 0}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <Plus size={18} />
          Abone Ekle
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-medium">Abone</th>
                <th className="py-3 px-4 font-medium">Saha</th>
                <th className="py-3 px-4 font-medium">Gün / Saat</th>
                <th className="py-3 px-4 font-medium">Dönem</th>
                <th className="py-3 px-4 font-medium">Durum</th>
                <th className="py-3 px-4 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {initialSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                    Henüz abonelik yok.
                  </td>
                </tr>
              ) : (
                initialSubscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-700">
                      {sub.guestName || sub.user?.name || sub.user?.email || "—"}
                      {(sub.guestPhone || sub.user?.phone) && (
                        <span className="block text-xs text-slate-400">
                          {sub.guestPhone || sub.user?.phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{sub.pitch.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {dayLabel(sub.dayOfWeek)}
                      <span className="block text-xs text-slate-400">
                        {sub.startTime} - {sub.endTime}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(sub.startDate).toLocaleDateString("tr-TR")}
                      {sub.endDate && (
                        <span className="block text-xs text-slate-400">
                          → {new Date(sub.endDate).toLocaleDateString("tr-TR")}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          sub.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {sub.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sub.isActive && (
                        <button
                          onClick={() => handleDeactivate(sub.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <UserX size={14} />
                          Sonlandır
                        </button>
                      )}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 bg-slate-50 sticky top-0">
              <h3 className="text-lg font-bold text-slate-800">Yeni Abonelik</h3>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Saha</label>
                <select
                  name="pitchId"
                  required
                  value={selectedPitchId}
                  onChange={(e) => setSelectedPitchId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {pitches.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gün</label>
                <select
                  name="dayOfWeek"
                  required
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Saat</label>
                <select
                  name="slot"
                  required
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {slotOptions.map((slot) => (
                    <option key={slot.startTime} value={`${slot.startTime}|${slot.endTime}`}>
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç</label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bitiş (ops.)
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                <input
                  name="guestName"
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input
                  name="guestPhone"
                  type="tel"
                  required
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Not (opsiyonel)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isPending ? "Kaydediliyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
