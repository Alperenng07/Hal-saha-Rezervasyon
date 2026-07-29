"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  parse,
  addMinutes,
  isBefore,
  startOfDay,
} from "date-fns";
import { tr } from "date-fns/locale";
import { createBooking } from "@/lib/actions/bookings";

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

interface WeeklyCalendarProps {
  pitches: Pitch[];
  initialBookings: Booking[];
  isLoggedIn: boolean;
  userName?: string;
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
  isLoggedIn,
  userName,
}: WeeklyCalendarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPitch, setSelectedPitch] = useState(pitches[0]?.id || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfCurrentWeek, i)
  );

  const pitch = pitches.find((p) => p.id === selectedPitch);

  const generateSlots = (p: Pitch) => {
    if (!p) return [];
    const slots = [];
    let current = parse(p.openTime, "HH:mm", new Date());
    const end = parse(p.closeTime, "HH:mm", new Date());
    current = addMinutes(current, p.slotOffsetMinutes);

    while (isBefore(current, end)) {
      const startTime = format(current, "HH:mm");
      current = addMinutes(current, p.slotDurationMinutes);
      const endTime = format(current, "HH:mm");
      if (isBefore(parse(endTime, "HH:mm", new Date()), end) || endTime === format(end, "HH:mm")) {
        slots.push({ startTime, endTime });
      } else {
        break;
      }
    }
    return slots;
  };

  const slots = pitch ? generateSlots(pitch) : [];

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const isSlotBooked = (date: Date, startTime: string) => {
    return initialBookings.some(
      (b) =>
        b.pitchId === selectedPitch &&
        isSameDay(new Date(b.date), date) &&
        b.startTime === startTime
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
    if (!isLoggedIn) {
      router.push("/login?redirect=/");
      return;
    }

    setError(null);
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

    setError(null);
    startTransition(async () => {
      const result = await createBooking({
        pitchId: selectedPitch,
        date: format(selectedSlot.date, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
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
    <div className="bg-white/80 backdrop-blur-xl rounded-[1.4rem] overflow-hidden relative ring-1 ring-slate-900/5">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/50">
        <div className="flex flex-wrap gap-2 w-full md:w-auto p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
          {pitches.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPitch(p.id)}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex-1 md:flex-none whitespace-nowrap ${
                selectedPitch === p.id
                  ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-white md:bg-transparent p-3 md:p-0 rounded-xl border border-slate-200/50 md:border-0 shadow-sm md:shadow-none">
          <button
            onClick={handlePrevWeek}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors active:scale-95"
          >
            ←
          </button>
          <div className="flex flex-col items-center">
            <span className="font-bold text-slate-900 min-w-[140px] sm:min-w-[160px] text-center text-[15px] sm:text-base tracking-tight">
              {format(startOfCurrentWeek, "d MMM", { locale: tr })} -{" "}
              {format(addDays(startOfCurrentWeek, 6), "d MMM", { locale: tr })}
            </span>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              {format(startOfCurrentWeek, "yyyy")}
            </span>
          </div>
          <button
            onClick={handleNextWeek}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors active:scale-95"
          >
            →
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 pt-2 relative">
        <table className="w-full text-sm text-left border-separate border-spacing-0 min-w-[900px]">
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
                    className={`p-4 border-b border-slate-100 text-center w-[12%] min-w-[110px] ${isToday ? "bg-emerald-50/50" : "bg-transparent"}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? "text-emerald-600" : "text-slate-400"}`}
                      >
                        {format(day, "EEEE", { locale: tr })}
                      </span>
                      <span
                        className={`h-8 w-8 flex items-center justify-center rounded-full text-base font-bold ${isToday ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-800"}`}
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
            {slots.map((slot, i) => (
              <tr key={i} className="group hover:bg-slate-50/80 transition-colors">
                <td className="p-3 border-b border-slate-100 text-center sticky left-0 z-10 bg-white/95 backdrop-blur-md">
                  <div className="inline-block px-3 py-1 rounded-md bg-slate-100/80 text-slate-600 font-semibold text-xs tracking-wide">
                    {slot.startTime}
                  </div>
                </td>
                {weekDays.map((day, j) => {
                  const booked = isSlotBooked(day, slot.startTime);
                  const isPast = isSlotPast(day, slot.startTime);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <td
                      key={j}
                      className={`p-2 border-b border-slate-100 relative h-[64px] ${isToday ? "bg-emerald-50/30" : ""}`}
                    >
                      {booked ? (
                        <div className="absolute inset-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
                          DOLU
                        </div>
                      ) : isPast ? (
                        <div className="absolute inset-1.5 bg-slate-50/80 text-slate-400 rounded-lg flex items-center justify-center font-medium text-xs border border-dashed border-slate-200">
                          Geçti
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            handleReserveClick(day, slot.startTime, slot.endTime)
                          }
                          className="absolute inset-1.5 bg-emerald-50/50 border border-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-xs opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white hover:border-transparent hover:shadow-md transition-all duration-300 scale-95 hover:scale-100"
                        >
                          SEÇ
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-900/5">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                Rezervasyon Onayı
              </h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {userName ? `Merhaba ${userName},` : "Lütfen"} rezervasyon bilgilerinizi onaylayın.
              </p>
            </div>

            <div className="p-6 space-y-5 bg-white">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Saha</span>
                  <span className="text-slate-900 font-bold">{selectedSlot.pitchName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Tarih</span>
                  <span className="text-slate-900 font-bold">
                    {format(selectedSlot.date, "d MMMM yyyy", { locale: tr })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Saat</span>
                  <div className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md font-bold text-sm">
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                  Not (opsiyonel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm min-h-[80px]"
                  placeholder="Eklemek istediğiniz bir not..."
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 pt-2 pb-8 flex gap-3 bg-white">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="flex-1 px-4 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                İptal
              </button>
              <button
                onClick={confirmBooking}
                disabled={isPending}
                className="flex-1 px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-60"
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
