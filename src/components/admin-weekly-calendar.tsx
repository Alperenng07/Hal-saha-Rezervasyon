"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  format,
  isSameDay,
  isBefore,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { tr } from "date-fns/locale";
import { XCircle, CalendarPlus, UserX } from "lucide-react";
import { createBookingAdmin, cancelBooking } from "@/lib/actions/bookings";
import {
  deactivateSubscription,
  skipSubscriptionOccurrence,
} from "@/lib/actions/subscriptions";
import {
  formatSlotLabel,
  generateSlots,
  getActualSlotDateTime,
  getBookingDate,
  getCurrentBusinessDay,
  isOvernightSlot,
  normalizeTime,
} from "@/lib/slots";
import { findBlockingSubscription } from "@/lib/subscription-utils";

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
  guestName?: string | null;
  guestPhone?: string | null;
  isManual?: boolean;
};

type Subscription = {
  id: string;
  pitchId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  guestName?: string | null;
  guestPhone?: string | null;
};

type SubscriptionException = {
  subscriptionId: string;
  date: Date;
};

type SlotContext = {
  businessDay: Date;
  bookingDate: Date;
  startTime: string;
  endTime: string;
};

type ModalMode = "add-booking" | "cancel-booking" | "cancel-subscription" | null;

export default function AdminWeeklyCalendar({
  pitches,
  initialBookings,
  subscriptions,
  subscriptionExceptions,
}: {
  pitches: Pitch[];
  initialBookings: Booking[];
  subscriptions: Subscription[];
  subscriptionExceptions: SubscriptionException[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPitch, setSelectedPitch] = useState(pitches[0]?.id || "");
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [slotContext, setSlotContext] = useState<SlotContext | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
  const pitch = pitches.find((p) => p.id === selectedPitch);
  const openTime = pitch?.openTime ?? "12:00";
  const slots = pitch ? generateSlots(pitch) : [];
  const businessToday = pitch
    ? getCurrentBusinessDay(pitch.openTime, pitch.closeTime)
    : startOfDay(new Date());

  useEffect(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const defaultDay =
      days.find((day) => !isBefore(day, businessToday)) ??
      days.find((day) => isSameDay(day, businessToday)) ??
      days[0];
    setSelectedDay(defaultDay);
  }, [currentDate, pitch?.id, pitch?.openTime, pitch?.closeTime, businessToday]);

  const getBookingAtSlot = (businessDay: Date, startTime: string) => {
    const bookingDate = getBookingDate(businessDay, startTime, openTime);
    return initialBookings.find(
      (booking) =>
        booking.pitchId === selectedPitch &&
        isSameDay(new Date(booking.date), bookingDate) &&
        normalizeTime(booking.startTime) === startTime
    );
  };

  const getSubscriptionAtSlot = (businessDay: Date, startTime: string): Subscription | undefined => {
    const bookingDate = getBookingDate(businessDay, startTime, openTime);
    const blocking = findBlockingSubscription(
      subscriptions,
      bookingDate,
      selectedPitch,
      startTime,
      subscriptionExceptions
    );
    if (!blocking) return undefined;
    return subscriptions.find((subscription) => subscription.id === blocking.id);
  };

  const isSlotPast = (businessDay: Date, startTime: string) => {
    if (!pitch) return false;
    const actual = getActualSlotDateTime(businessDay, startTime, openTime);
    return isBefore(actual, new Date());
  };

  const resetForm = () => {
    setGuestName("");
    setGuestPhone("");
    setNotes("");
    setError(null);
  };

  const openAddModal = (businessDay: Date, startTime: string, endTime: string) => {
    resetForm();
    const bookingDate = getBookingDate(businessDay, startTime, openTime);
    setSlotContext({ businessDay, bookingDate, startTime, endTime });
    setSelectedBooking(null);
    setSelectedSubscription(null);
    setModalMode("add-booking");
  };

  const openBookingCancelModal = (booking: Booking) => {
    setError(null);
    setSelectedBooking(booking);
    setSelectedSubscription(null);
    setSlotContext(null);
    setModalMode("cancel-booking");
  };

  const openSubscriptionCancelModal = (
    subscription: Subscription,
    businessDay: Date,
    startTime: string,
    endTime: string
  ) => {
    setError(null);
    const bookingDate = getBookingDate(businessDay, startTime, openTime);
    setSlotContext({ businessDay, bookingDate, startTime, endTime });
    setSelectedSubscription(subscription);
    setSelectedBooking(null);
    setModalMode("cancel-subscription");
  };

  const closeModal = () => {
    setModalMode(null);
    setSlotContext(null);
    setSelectedBooking(null);
    setSelectedSubscription(null);
    setError(null);
  };

  const handleSlotClick = (businessDay: Date, startTime: string, endTime: string) => {
    const booking = getBookingAtSlot(businessDay, startTime);
    if (booking) {
      openBookingCancelModal(booking);
      return;
    }

    const subscription = getSubscriptionAtSlot(businessDay, startTime);
    if (subscription) {
      openSubscriptionCancelModal(subscription, businessDay, startTime, endTime);
      return;
    }

    openAddModal(businessDay, startTime, endTime);
  };

  const confirmAddBooking = () => {
    if (!slotContext || !selectedPitch) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      setError("Ad soyad ve telefon zorunludur.");
      return;
    }

    startTransition(async () => {
      const result = await createBookingAdmin({
        pitchId: selectedPitch,
        date: format(slotContext.bookingDate, "yyyy-MM-dd"),
        startTime: slotContext.startTime,
        endTime: slotContext.endTime,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        notes: notes || undefined,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      closeModal();
      router.refresh();
    });
  };

  const confirmCancelBooking = () => {
    if (!selectedBooking) return;

    startTransition(async () => {
      const result = await cancelBooking(selectedBooking.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      closeModal();
      router.refresh();
    });
  };

  const confirmSkipSubscriptionWeek = () => {
    if (!selectedSubscription || !slotContext) return;

    startTransition(async () => {
      const result = await skipSubscriptionOccurrence({
        subscriptionId: selectedSubscription.id,
        date: format(slotContext.bookingDate, "yyyy-MM-dd"),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      closeModal();
      router.refresh();
    });
  };

  const confirmDeactivateSubscription = () => {
    if (!selectedSubscription) return;

    startTransition(async () => {
      const result = await deactivateSubscription(selectedSubscription.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      closeModal();
      router.refresh();
    });
  };

  const renderSlotButton = (
    businessDay: Date,
    slot: { startTime: string; endTime: string },
    compact = false
  ) => {
    const booking = getBookingAtSlot(businessDay, slot.startTime);
    const subscription = getSubscriptionAtSlot(businessDay, slot.startTime);
    const isPast = isSlotPast(businessDay, slot.startTime);

    if (booking) {
      return (
        <button
          type="button"
          onClick={() => openBookingCancelModal(booking)}
          className={`w-full bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-semibold hover:bg-rose-100 transition-colors ${
            compact ? "py-2.5 text-xs" : "absolute inset-1.5 flex flex-col items-center justify-center text-xs"
          }`}
        >
          <span>DOLU</span>
          {!compact && (
            <span className="text-[10px] font-normal mt-0.5 truncate max-w-full px-1">
              {booking.guestName || "Misafir"}
            </span>
          )}
        </button>
      );
    }

    if (subscription) {
      return (
        <button
          type="button"
          onClick={() =>
            openSubscriptionCancelModal(subscription, businessDay, slot.startTime, slot.endTime)
          }
          className={`w-full bg-blue-50 border border-blue-200 text-blue-800 rounded-lg font-semibold hover:bg-blue-100 transition-colors ${
            compact ? "py-2.5 text-xs" : "absolute inset-1.5 flex flex-col items-center justify-center text-xs"
          }`}
        >
          <span>ABONE</span>
          {!compact && (
            <span className="text-[10px] font-normal mt-0.5 truncate max-w-full px-1">
              {subscription.guestName || "Abone"}
            </span>
          )}
        </button>
      );
    }

    if (isPast) {
      return (
        <button
          type="button"
          onClick={() => handleSlotClick(businessDay, slot.startTime, slot.endTime)}
          className={`w-full bg-slate-50 text-slate-500 border border-dashed border-slate-200 rounded-lg font-medium hover:bg-slate-100 transition-colors ${
            compact ? "py-2.5 text-xs" : "absolute inset-1.5 flex items-center justify-center text-xs"
          }`}
        >
          {compact ? "Geçmiş · Ekle" : "Geçmiş · Ekle"}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleSlotClick(businessDay, slot.startTime, slot.endTime)}
        className={`w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold hover:bg-emerald-100 transition-colors ${
          compact ? "py-2.5 text-xs" : "absolute inset-1.5 flex items-center justify-center text-xs"
        }`}
      >
        {compact ? `Ekle · ${slot.endTime}` : "EKLE"}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div className="flex gap-2 overflow-x-auto scroll-touch">
          {pitches.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPitch(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold shrink-0 transition-colors ${
                selectedPitch === p.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Önceki hafta"
          >
            ←
          </button>
          <div className="text-center min-w-0">
            <p className="font-bold text-slate-900 text-sm sm:text-base">
              {format(startOfCurrentWeek, "d MMM", { locale: tr })} –{" "}
              {format(addDays(startOfCurrentWeek, 6), "d MMM yyyy", { locale: tr })}
            </p>
            <p className="text-xs text-emerald-700 font-medium">Takvimden ekle / iptal et</p>
          </div>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Sonraki hafta"
          >
            →
          </button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Boş · Ekle
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-100 border border-rose-200" /> Dolu · İptal
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Abone · İptal
        </span>
      </div>

      {/* Mobil */}
      <div className="md:hidden px-3 pb-4">
        <div className="flex gap-2 overflow-x-auto py-3 scroll-touch">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, businessToday);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`shrink-0 flex flex-col items-center min-w-[3.25rem] px-2 py-2 rounded-xl border ${
                  isSelected
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : isToday
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                <span className="text-[10px] font-bold uppercase">
                  {format(day, "EEE", { locale: tr })}
                </span>
                <span className="text-base font-bold">{format(day, "d")}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 mb-3">
          {format(selectedDay, "d MMMM yyyy, EEEE", { locale: tr })}
        </p>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto scroll-touch">
          {slots.map((slot) => (
            <div
              key={slot.startTime}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5"
            >
              <div className="shrink-0 w-[4.5rem] text-center text-[10px] font-bold text-slate-600 bg-slate-50 rounded-lg py-2">
                {formatSlotLabel(selectedDay, slot.startTime, openTime)}
              </div>
              <div className="flex-1">{renderSlotButton(selectedDay, slot, true)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Masaüstü */}
      <div className="hidden md:block overflow-x-auto pb-4 scroll-touch">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr>
              <th className="p-3 border-b border-slate-100 text-center text-slate-400 text-xs sticky left-0 bg-white z-10">
                Saat
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.toISOString()}
                  className={`p-3 border-b border-slate-100 text-center ${
                    isSameDay(day, businessToday) ? "bg-emerald-50" : ""
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase text-slate-400">
                    {format(day, "EEE", { locale: tr })}
                  </div>
                  <div className="text-base font-bold text-slate-800">{format(day, "d")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.startTime}>
                <td className="p-2 border-b border-slate-100 text-center sticky left-0 bg-white z-10">
                  <div className="inline-block px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                    {slot.startTime}
                  </div>
                </td>
                {weekDays.map((day) => (
                  <td key={day.toISOString()} className="p-1 border-b border-slate-100 h-[68px] relative">
                    {renderSlotButton(day, slot, false)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[min(90dvh,640px)] flex flex-col overflow-hidden">
            <div className="px-4 py-4 border-b border-slate-100 shrink-0">
              {modalMode === "add-booking" && (
                <>
                  <div className="flex items-center gap-2 text-emerald-700 mb-1">
                    <CalendarPlus size={18} />
                    <h3 className="text-lg font-bold text-slate-900">Rezervasyon Ekle</h3>
                  </div>
                  {slotContext && (
                    <p className="text-sm text-slate-500">
                      {pitch?.name} · {format(slotContext.bookingDate, "d MMM yyyy, EEEE", { locale: tr })} ·{" "}
                      {slotContext.startTime}–{slotContext.endTime}
                    </p>
                  )}
                </>
              )}
              {modalMode === "cancel-booking" && selectedBooking && (
                <>
                  <div className="flex items-center gap-2 text-rose-700 mb-1">
                    <XCircle size={18} />
                    <h3 className="text-lg font-bold text-slate-900">Rezervasyonu İptal Et</h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    {format(new Date(selectedBooking.date), "d MMM yyyy", { locale: tr })} ·{" "}
                    {selectedBooking.startTime}–{selectedBooking.endTime}
                  </p>
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {selectedBooking.guestName || "Misafir"}
                    {selectedBooking.guestPhone ? ` · ${selectedBooking.guestPhone}` : ""}
                  </p>
                </>
              )}
              {modalMode === "cancel-subscription" && selectedSubscription && slotContext && (
                <>
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <UserX size={18} />
                    <h3 className="text-lg font-bold text-slate-900">Abone Saati İptali</h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    {selectedSubscription.guestName || "Abone"} ·{" "}
                    {format(slotContext.bookingDate, "d MMM yyyy, EEEE", { locale: tr })} ·{" "}
                    {slotContext.startTime}–{slotContext.endTime}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    Sadece bu haftayı mı, yoksa aboneliği tamamen mi iptal etmek istiyorsunuz?
                  </p>
                </>
              )}
            </div>

            {modalMode === "add-booking" && (
              <div className="px-4 py-4 space-y-3 overflow-y-auto flex-1">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ad Soyad"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Telefon"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Not (opsiyonel)"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none"
                />
              </div>
            )}

            {error && (
              <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="px-4 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 shrink-0 bg-white">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-medium text-slate-700"
              >
                Vazgeç
              </button>

              {modalMode === "add-booking" && (
                <button
                  type="button"
                  onClick={confirmAddBooking}
                  disabled={isPending}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold disabled:opacity-60"
                >
                  {isPending ? "Kaydediliyor..." : "Rezervasyon Oluştur"}
                </button>
              )}

              {modalMode === "cancel-booking" && (
                <button
                  type="button"
                  onClick={confirmCancelBooking}
                  disabled={isPending}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-semibold disabled:opacity-60"
                >
                  {isPending ? "İptal ediliyor..." : "Rezervasyonu İptal Et"}
                </button>
              )}

              {modalMode === "cancel-subscription" && (
                <>
                  <button
                    type="button"
                    onClick={confirmSkipSubscriptionWeek}
                    disabled={isPending}
                    className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold disabled:opacity-60"
                  >
                    Sadece Bu Hafta
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeactivateSubscription}
                    disabled={isPending}
                    className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-semibold disabled:opacity-60"
                  >
                    Tamamen İptal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
