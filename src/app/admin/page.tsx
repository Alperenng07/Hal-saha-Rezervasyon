import {
  getBusinessSettings,
  getPitches,
  getTodayBookingsCount,
  getActiveSubscriptionsCount,
  getUpcomingBookings,
} from "@/lib/data";

const statusLabels: Record<string, string> = {
  CONFIRMED: "Onaylı",
  PENDING: "Beklemede",
  CANCELLED: "İptal",
};

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-slate-100 text-slate-800",
};

export default async function AdminDashboard() {
  const [pitches, todayCount, subscriptionCount, upcoming, settings] =
    await Promise.all([
      getPitches(),
      getTodayBookingsCount(),
      getActiveSubscriptionsCount(),
      getUpcomingBookings(10),
      getBusinessSettings(),
    ]);

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Hoş geldin, {settings?.name ?? "Yönetici"}.
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
                      {booking.guestPhone && (
                        <span className="block text-xs text-slate-400">{booking.guestPhone}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {booking.date.toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {booking.startTime} - {booking.endTime}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] ?? statusColors.CANCELLED}`}
                      >
                        {statusLabels[booking.status] ?? booking.status}
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
