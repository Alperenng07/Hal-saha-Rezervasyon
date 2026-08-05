import {
  getBookings,
  getActiveSubscriptions,
  getSubscriptionExceptions,
} from "@/lib/data";
import { getAllPitchesAdmin } from "@/lib/actions/pitches";
import AdminWeeklyCalendar from "@/components/admin-weekly-calendar";

export default async function AdminCalendarPage() {
  const [bookings, subscriptions, subscriptionExceptions, pitches] = await Promise.all([
    getBookings(),
    getActiveSubscriptions(),
    getSubscriptionExceptions(),
    getAllPitchesAdmin(),
  ]);

  const activePitches = pitches.filter((pitch) => pitch.isActive);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Takvim</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Boş slota dokunarak rezervasyon ekleyin; dolu veya abone slota dokunarak iptal edin.
        </p>
      </div>

      {activePitches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Aktif saha bulunamadı. Önce saha tanımlayın.
        </div>
      ) : (
        <AdminWeeklyCalendar
          pitches={activePitches}
          initialBookings={bookings}
          subscriptions={subscriptions}
          subscriptionExceptions={subscriptionExceptions}
        />
      )}
    </div>
  );
}
