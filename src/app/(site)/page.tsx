import { getBusinessSettings, getPitches, getBookings } from "@/lib/data";
import WeeklyCalendar from "@/components/weekly-calendar";

export default async function Home() {
  const [settings, pitches, bookings] = await Promise.all([
    getBusinessSettings(),
    getPitches(),
    getBookings(),
  ]);

  const businessName = settings?.name ?? "Halı Saha Tesisleri";

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 selection:bg-emerald-200">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[70%] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-teal-400/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-16 md:py-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="mb-16 text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold tracking-wide mb-2 shadow-sm">
            <span className="relative flex h-2.5 w-2.5 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Hemen Rezervasyon Yapın
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            <span className="block text-slate-900">Mükemmel Maç İçin</span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 pb-2">
              Sahanı Ayırt.
            </span>
          </h1>
          <p className="text-xl text-slate-500/90 leading-relaxed max-w-2xl mx-auto">
            <strong className="text-slate-700 font-semibold">{businessName}</strong>{" "}
            sahaları için uygun saatleri aşağıdan gerçek zamanlı inceleyin ve
            saniyeler içinde rezervasyonunuzu tamamlayın.
          </p>
        </div>

        {pitches.length === 0 ? (
          <div className="max-w-xl mx-auto text-center bg-white rounded-2xl border border-slate-200 p-10 shadow-sm">
            <p className="text-slate-600 font-medium">Henüz aktif saha tanımlanmamış.</p>
          </div>
        ) : (
          <div className="relative max-w-6xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-slate-200/50 to-transparent shadow-2xl shadow-slate-200/50">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-20 pointer-events-none" />
            <WeeklyCalendar pitches={pitches} initialBookings={bookings} />
          </div>
        )}
      </div>
    </div>
  );
}
