"use client";

import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay, parse, addMinutes, isBefore, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";

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
}

interface SelectedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  pitchName: string;
}

export default function WeeklyCalendar({ pitches, initialBookings }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPitch, setSelectedPitch] = useState(pitches[0]?.id || "");
  
  // Rezervasyon Modalı State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  const pitch = pitches.find((p) => p.id === selectedPitch);

  const generateSlots = (p: Pitch) => {
    if (!p) return [];
    let slots = [];
    let current = parse(p.openTime, "HH:mm", new Date());
    const end = parse(p.closeTime, "HH:mm", new Date());
    // Apply offset
    current = addMinutes(current, p.slotOffsetMinutes);
    
    // If close is before open (e.g., 00:00 or 02:00), we'd need more complex logic, 
    // but assuming simple cases like 09:00 to 23:59 for now.
    while (isBefore(current, end) || current.getTime() === end.getTime()) {
      const startTime = format(current, "HH:mm");
      current = addMinutes(current, p.slotDurationMinutes);
      const endTime = format(current, "HH:mm");
      slots.push({ startTime, endTime });
    }
    return slots;
  };

  const slots = pitch ? generateSlots(pitch) : [];

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const isSlotBooked = (date: Date, startTime: string) => {
    return initialBookings.some(
      (b) => b.pitchId === selectedPitch && isSameDay(new Date(b.date), date) && b.startTime === startTime
    );
  };

  const handleReserveClick = (day: Date, startTime: string, endTime: string) => {
    setSelectedSlot({
      date: day,
      startTime,
      endTime,
      pitchName: pitch?.name || "",
    });
    setIsModalOpen(true);
  };

  const confirmBooking = () => {
    alert("Rezervasyon başarıyla onaylandı! (Geliştirme aşamasında mock işlemdir)");
    setIsModalOpen(false);
    setSelectedSlot(null);
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
          <button onClick={handlePrevWeek} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex flex-col items-center">
            <span className="font-bold text-slate-900 min-w-[140px] sm:min-w-[160px] text-center text-[15px] sm:text-base tracking-tight">
              {format(startOfCurrentWeek, "d MMM", { locale: tr })} - {format(addDays(startOfCurrentWeek, 6), "d MMM", { locale: tr })}
            </span>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">{format(startOfCurrentWeek, "yyyy")}</span>
          </div>
          <button onClick={handleNextWeek} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 pt-2 relative">
        <table className="w-full text-sm text-left border-separate border-spacing-0 min-w-[900px]">
          <thead>
            <tr>
              <th className="p-4 border-b border-slate-100 bg-white/95 backdrop-blur-md min-w-[100px] text-center text-slate-400 font-bold uppercase tracking-wider text-xs sticky left-0 z-20 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">Saat</th>
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <th key={i} className={`p-4 border-b border-slate-100 text-center w-[12%] min-w-[110px] transition-colors ${isToday ? 'bg-emerald-50/50' : 'bg-transparent'}`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {format(day, "EEEE", { locale: tr })}
                      </span>
                      <span className={`h-8 w-8 flex items-center justify-center rounded-full text-base font-bold ${isToday ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-800'}`}>
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
                <td className="p-3 border-b border-slate-100 text-center sticky left-0 z-10 bg-white/95 backdrop-blur-md shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/95 transition-colors">
                  <div className="inline-block px-3 py-1 rounded-md bg-slate-100/80 text-slate-600 font-semibold text-xs tracking-wide">
                    {slot.startTime}
                  </div>
                </td>
                {weekDays.map((day, j) => {
                  const booked = isSlotBooked(day, slot.startTime);
                  const isPast = isBefore(day, startOfDay(new Date()));
                  const isToday = isSameDay(day, new Date());
                  return (
                    <td key={j} className={`p-2 border-b border-slate-100 relative h-[64px] ${isToday ? 'bg-emerald-50/30' : ''}`}>
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
                          onClick={() => handleReserveClick(day, slot.startTime, slot.endTime)}
                          className="absolute inset-1.5 bg-emerald-50/50 border border-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-xs opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white hover:border-transparent hover:shadow-md hover:shadow-emerald-500/20 transition-all duration-300 scale-95 hover:scale-100"
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

      {/* Rezervasyon Modalı */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Rezervasyon Onayı</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Lütfen rezervasyon bilgilerinizi kontrol edin.</p>
            </div>
            
            <div className="p-6 space-y-5 bg-white">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Saha</span>
                  <span className="text-slate-900 font-bold">{selectedSlot.pitchName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Tarih</span>
                  <span className="text-slate-900 font-bold">{format(selectedSlot.date, "d MMMM yyyy", { locale: tr })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Saat</span>
                  <div className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md font-bold text-sm tracking-wide">
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">Ad Soyad</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm" placeholder="Adınız Soyadınız" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">Telefon Numarası</label>
                  <input type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm" placeholder="05XX XXX XX XX" />
                </div>
              </div>
            </div>
            
            <div className="p-6 pt-2 pb-8 flex gap-3 bg-white">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
              >
                İptal
              </button>
              <button 
                onClick={confirmBooking}
                className="flex-1 px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
