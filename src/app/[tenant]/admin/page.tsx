import { notFound } from "next/navigation";
import {
  getTenantSettings,
  getPitches,
  getTodayBookingsCount,
  getActiveSubscriptionsCount,
  getUpcomingBookings,
} from "@/lib/data";

type Props = { params: Promise<{ tenant: string }> };

export default async function AdminDashboard({ params }: Props) {
  const { tenant: tenantSlug } = await params;
  const settings = await getTenantSettings(tenantSlug);
  if (!settings) notFound();

  const [pitches, todayCount, subscriptionCount, upcoming] = await Promise.all([
    getPitches(settings.id),
    getTodayBookingsCount(settings.id),
    getActiveSubscriptionsCount(settings.id),
    getUpcomingBookings(settings.id, 10),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Hoş geldin, {settings.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Aktif Saha</h3>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{pitches.length}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Bugünkü Rezervasyon</h3>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{todayCount}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Aktif Abonelik</h3>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{subscriptionCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Yaklaşan Rezervasyonlar</h2>
        {upcoming.length === 0 ? (
          <p className="text-slate-500 text-sm">Yaklaşan rezervasyon yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-medium">Saha</th>
                  <th className="py-3 px-4 font-medium">Müşteri</th>
                  <th className="py-3 px-4 font-medium">Tarih</th>
                  <th className="py-3 px-4 font-medium">Saat</th>
                  <th className="py-3 px-4 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {booking.pitch.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {booking.guestName ||
                        booking.user?.name ||
                        booking.user?.email ||
                        "Misafir"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {booking.date.toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {booking.startTime} - {booking.endTime}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Onaylı
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
