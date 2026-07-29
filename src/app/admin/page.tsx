import { getBusinessSettings, getPitches, getBookings } from "@/lib/data";

export default async function AdminDashboard() {
  const pitches = await getPitches();
  const bookings = await getBookings();
  const settings = await getBusinessSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Hoş geldin, {settings.name} yöneticisi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Toplam Saha</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{pitches.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Aktif Rezervasyon (Bugün)</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{bookings.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Abonelikler</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">0</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Yaklaşan Rezervasyonlar</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-medium">Saha</th>
                <th className="py-3 px-4 font-medium">Tarih</th>
                <th className="py-3 px-4 font-medium">Saat</th>
                <th className="py-3 px-4 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const pitch = pitches.find(p => p.id === booking.pitchId);
                return (
                  <tr key={booking.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-700">{pitch?.name || "Bilinmiyor"}</td>
                    <td className="py-3 px-4 text-slate-600">{booking.date.toLocaleDateString("tr-TR")}</td>
                    <td className="py-3 px-4 text-slate-600">{booking.startTime} - {booking.endTime}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Onaylı
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
