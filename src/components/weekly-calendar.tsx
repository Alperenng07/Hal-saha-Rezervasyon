"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  parse,
  isBefore,
  startOfDay,
  getDay,
} from "date-fns";
import { tr } from "date-fns/locale";
import { createBooking } from "@/lib/actions/bookings";
import { generateSlots, normalizeTime } from "@/lib/slots";

type Pitch = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  slotOffsetMinutes: number;
};

type Booking = {
  id: string;
  pitchId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
};

type Subscription = {
  pitchId: string;
  dayOfWeek: number;
  startTime: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
};

interface WeeklyCalendarProps {
  pitches: Pitch[];
  initialBookings: Booking[];
  subscriptions?: Subscription[];
}

interface SelectedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  pitchName: string;
}

export default function WeeklyCalendar({
  pitches,
  initialBookings,
  subscriptions = [],
}: WeeklyCalendarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPitch, setSelectedPitch] = useState(pitches[0]?.id || "");
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfCurrentWeek, i)
  );

  useEffect(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const today = startOfDay(new Date());
    const defaultDay = days.find((day) => !isBefore(day, today)) ?? days[0];
    setSelectedDay(defaultDay);
  }, [currentDate]);

  const pitch = pitches.find((p) => p.id === selectedPitch);

  const slots = pitch ? generateSlots(pitch) : [];

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const isSlotBooked = (date: Date, startTime: string) => {
    return initialBookings.some(
      (b) =>
        b.pitchId === selectedPitch &&
        isSameDay(new Date(b.date), date) &&
        normalizeTime(b.startTime) === startTime
    );
  };

  const isSlotSubscribed = (date: Date, startTime: string) => {
    const day = startOfDay(date);
    return subscriptions.some(
      (s) =>
        s.isActive &&
        s.pitchId === selectedPitch &&
        s.dayOfWeek === getDay(date) &&
        normalizeTime(s.startTime) === startTime &&
        !isBefore(day, startOfDay(new Date(s.startDate))) &&
        (!s.endDate || !isBefore(startOfDay(new Date(s.endDate)), day))
    );
  };

  const isSlotPast = (day: Date, startTime: string) => {
    const today = startOfDay(new Date());
    if (isBefore(day, today)) return true;
    if (isSameDay(day, new Date())) {
      const slotTime = parse(startTime, "HH:mm", day);
      return isBefore(slotTime, new Date());
    }
    return false;
  };

  const handleReserveClick = (day: Date, startTime: string, endTime: string) => {
    setError(null);
    setGuestName("");
    setGuestPhone("");
    setNotes("");
    setSelectedSlot({
      date: day,
      startTime,
      endTime,
      pitchName: pitch?.name || "",
    });
    setIsModalOpen(true);
  };

  const confirmBooking = () => {
    if (!selectedSlot || !selectedPitch) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      setError("Ad soyad ve telefon numarası zorunludur.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createBooking({
        pitchId: selectedPitch,
        date: format(selectedSlot.date, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        notes: notes || undefined,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setIsModalOpen(false);
      setSelectedSlot(null);
      router.refresh();
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-[1.4rem] overflow-hidden relative ring-1 ring-slate-900/5">
      <div className="p-3 sm:p-4 md:p-6 border-b border-slate-100 flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-between md:items-center bg-white/50">
        <div className="flex gap-1.5 sm:gap-2 w-full md:w-auto p-1 bg-slate-100/80 rounded-lg sm:rounded-xl border border-slate-200/50 overflow-x-auto scroll-touch">
          {pitches.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPitch(p.id)}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm shrink-0 pitch-tab ${
                selectedPitch === p.id ? "pitch-tab-active" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-4 bg-white md:bg-transparent p-2 sm:p-3 md:p-0 rounded-lg sm:rounded-xl border border-slate-200/50 md:border-0 shadow-sm md:shadow-none">
          <button
            onClick={handlePrevWeek}
            className="p-2 text-slate-400 rounded-lg nav-icon-btn"
            aria-label="Önceki hafta"
          >
            ←
          </button>
          <div className="flex flex-col items-center min-w-0">
            <span className="font-bold text-slate-900 text-center text-sm sm:text-[15px] md:text-base tracking-tight">
              {format(startOfCurrentWeek, "d MMM", { locale: tr })} -{" "}
              {format(addDays(startOfCurrentWeek, 6), "d MMM", { locale: tr })}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-brand uppercase tracking-wider">
              {format(startOfCurrentWeek, "yyyy")}
            </span>
          </div>
          <button
            onClick={handleNextWeek}
            className="p-2 text-slate-400 rounded-lg nav-icon-btn"
            aria-label="Sonraki hafta"
          >
            →
          </button>
        </div>
      </div>

      {/* Mobil: gün seçici + slot listesi */}
      <div className="md:hidden px-3 pb-4">
        <div className="flex gap-2 overflow-x-auto py-3 -mx-1 px-1 scroll-touch">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDay);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`shrink-0 flex flex-col items-center min-w-[3.25rem] px-2 py-2 rounded-xl border day-pill ${
                  isSelected
                    ? "day-pill-selected"
                    : isToday
                      ? "day-pill-today"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-[10px] font-bold uppercase">
                  {format(day, "EEE", { locale: tr })}
                </span>
                <span className="text-base font-bold leading-tight">{format(day, "d")}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 mb-2 px-0.5">
          {format(selectedDay, "d MMMM yyyy, EEEE", { locale: tr })}
        </p>

        {slots.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Bu saha için tanımlı çalışma saati bulunamadı.
          </p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5 scroll-touch">
            {slots.map((slot) => {
              const booked = isSlotBooked(selectedDay, slot.startTime);
              const subscribed = isSlotSubscribed(selectedDay, slot.startTime);
              const isPast = isSlotPast(selectedDay, slot.startTime);
              return (
                <div
                  key={slot.startTime}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm"
                >
                  <div className="shrink-0 w-[4.5rem] text-center text-xs font-bold text-slate-600 bg-slate-50 rounded-lg py-2">
                    {slot.startTime}
                  </div>
                  {booked ? (
                    <div className="flex-1 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-center font-bold text-xs">
                      DOLU
                    </div>
                  ) : subscribed ? (
                    <div className="flex-1 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-center font-bold text-xs">
                      ABONE
                    </div>
                  ) : isPast ? (
                    <div className="flex-1 py-2.5 bg-slate-50 text-slate-400 rounded-lg text-center font-medium text-xs border border-dashed border-slate-200">
                      Geçti
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleReserveClick(selectedDay, slot.startTime, slot.endTime)
                      }
                      className="flex-1 py-2.5 rounded-lg font-bold text-xs slot-available"
                    >
                      SEÇ · {slot.endTime}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Masaüstü: haftalık tablo */}
      <div className="hidden md:block overflow-x-auto pb-6 pt-2 relative scroll-touch">
        <table className="w-full text-sm text-left border-separate border-spacing-0 min-w-[760px] lg:min-w-[900px]">
          <thead>
            <tr>
              <th className="p-4 border-b border-slate-100 bg-white/95 backdrop-blur-md min-w-[100px] text-center text-slate-400 font-bold uppercase tracking-wider text-xs sticky left-0 z-20">
                Saat
              </th>
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <th
                    key={i}
                    className={`p-4 border-b border-slate-100 text-center w-[12%] min-w-[110px] ${isToday ? "bg-brand-today" : "bg-transparent"}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? "text-brand" : "text-slate-400"}`}
                      >
                        {format(day, "EEEE", { locale: tr })}
                      </span>
                      <span
                        className={`h-8 w-8 flex items-center justify-center rounded-full text-base font-bold ${isToday ? "bg-brand text-white shadow-brand-sm" : "text-slate-800"}`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white/40">
            {slots.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  Bu saha için tanımlı çalışma saati bulunamadı. Lütfen yönetim panelinden
                  açılış/kapanış saatlerini kontrol edin.
                </td>
              </tr>
            ) : (
              slots.map((slot, i) => (
              <tr key={i} className="group hover:bg-slate-50/80 transition-colors">
                <td className="p-3 border-b border-slate-100 text-center sticky left-0 z-10 bg-white/95 backdrop-blur-md">
                  <div className="inline-block px-3 py-1 rounded-md bg-slate-100/80 text-slate-600 font-semibold text-xs tracking-wide">
                    {slot.startTime}
                  </div>
                </td>
                {weekDays.map((day, j) => {
                  const booked = isSlotBooked(day, slot.startTime);
                  const subscribed = isSlotSubscribed(day, slot.startTime);
                  const isPast = isSlotPast(day, slot.startTime);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <td
                      key={j}
                      className={`p-2 border-b border-slate-100 relative h-[64px] ${isToday ? "bg-brand-today-cell" : ""}`}
                    >
                      {booked ? (
                        <div className="absolute inset-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
                          DOLU
                        </div>
                      ) : subscribed ? (
                        <div className="absolute inset-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
                          ABONE
                        </div>
                      ) : isPast ? (
                        <div className="absolute inset-1.5 bg-slate-50/80 text-slate-400 rounded-lg flex items-center justify-center font-medium text-xs border border-dashed border-slate-200">
                          Geçti
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleReserveClick(day, slot.startTime, slot.endTime)
                          }
                          className="absolute inset-1.5 z-10 rounded-lg flex items-center justify-center font-bold text-xs slot-available"
                        >
                          SEÇ
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[min(560px,calc(100dvh-1.5rem))] flex flex-col overflow-hidden ring-1 ring-slate-900/5">
            <div className="px-4 py-3 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">Rezervasyon Onayı</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bilgilerinizi girip onaylayın.
              </p>
            </div>

            <div className="px-4 py-3 space-y-3 overflow-y-auto flex-1 min-h-0">
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                <span className="text-slate-500">Saha</span>
                <span className="font-semibold text-slate-900 text-right">{selectedSlot.pitchName}</span>
                <span className="text-slate-500">Tarih</span>
                <span className="font-semibold text-slate-900 text-right">
                  {format(selectedSlot.date, "d MMM yyyy", { locale: tr })}
                </span>
                <span className="text-slate-500">Saat</span>
                <span className="font-semibold text-brand-strong text-right">
                  {selectedSlot.startTime} – {selectedSlot.endTime}
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm ring-brand"
                    placeholder="Adınız Soyadınız"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm ring-brand"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Not <span className="normal-case font-normal text-slate-400">(opsiyonel)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none ring-brand"
                    placeholder="Notunuz..."
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 flex gap-2 shrink-0 bg-white">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="flex-1 px-3 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all active:scale-[0.97] cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={confirmBooking}
                disabled={isPending}
                className="flex-1 px-3 py-2.5 btn-brand rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {isPending ? "Kaydediliyor..." : "Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
