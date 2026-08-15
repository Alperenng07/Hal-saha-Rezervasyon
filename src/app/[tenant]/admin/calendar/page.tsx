import { notFound } from "next/navigation";
import {
  getBookingsForTenant,
  getActiveSubscriptionsForTenant,
  getSubscriptionExceptionsForTenant,
  getTenantSettings,
} from "@/lib/data";
import { getAllPitchesAdmin } from "@/lib/actions/pitches";
import AdminWeeklyCalendar from "@/components/admin-weekly-calendar";

type Props = { params: Promise<{ tenant: string }> };

export default async function AdminCalendarPage({ params }: Props) {
  const { tenant: tenantSlug } = await params;
  const settings = await getTenantSettings(tenantSlug);
  if (!settings) notFound();

  const [bookings, subscriptions, subscriptionExceptions, pitches] = await Promise.all([
    getBookingsForTenant(settings.id),
    getActiveSubscriptionsForTenant(settings.id),
    getSubscriptionExceptionsForTenant(settings.id),
    getAllPitchesAdmin(tenantSlug),
  ]);

  const activePitches = pitches.filter((pitch) => pitch.isActive);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Takvim</h1>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm md:text-base">
          Boş slota dokunarak rezervasyon ekleyin; dolu veya abone slota dokunarak iptal edin.
        </p>
      </div>

      {activePitches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Aktif saha bulunamadı. Önce saha tanımlayın.
        </div>
      ) : (
        <AdminWeeklyCalendar
          tenantSlug={tenantSlug}
          pitches={activePitches}
          initialBookings={bookings}
          subscriptions={subscriptions}
          subscriptionExceptions={subscriptionExceptions}
        />
      )}
    </div>
  );
}
