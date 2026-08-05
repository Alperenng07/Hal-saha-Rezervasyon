import {
  getBusinessSettings,
  getPitches,
  getBookings,
  getActiveSubscriptions,
  getSubscriptionExceptions,
} from "@/lib/data";
import WeeklyCalendar from "@/components/weekly-calendar";

export default async function Home() {
  const [settings, pitches, bookings, subscriptions, subscriptionExceptions] = await Promise.all([
    getBusinessSettings(),
    getPitches(),
    getBookings(),
    getActiveSubscriptions(),
    getSubscriptionExceptions(),
  ]);

  const businessName = settings?.name ?? "Halı Saha Tesisleri";

  return (
    <div className="relative bg-slate-50">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[70%] rounded-full bg-brand-glow blur-[120px]" />
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-brand-glow-secondary blur-[100px]" />
      </div>

      <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-12 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-full">
        <div className="mb-6 sm:mb-12 md:mb-16 text-center max-w-3xl mx-auto space-y-3 sm:space-y-6">
          <div className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-brand-soft border border-brand text-brand-strong text-[11px] sm:text-sm font-semibold tracking-wide shadow-sm">
            <span className="relative flex h-2.5 w-2.5 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-ping opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-dot"></span>
            </span>
            Hemen Rezervasyon Yapın
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight px-1 sm:px-2">
            <span className="block text-slate-900">Mükemmel Maç İçin</span>
            <span className="block bg-clip-text text-transparent bg-brand-gradient pb-2">
              Sahanı Ayırt.
            </span>
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-slate-500/90 leading-relaxed max-w-2xl mx-auto px-1 sm:px-2">
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
          <div className="relative max-w-6xl mx-auto rounded-2xl sm:rounded-3xl p-0.5 sm:p-1 bg-gradient-to-b from-slate-200/50 to-transparent shadow-xl sm:shadow-2xl shadow-slate-200/50">
            <div className="absolute -inset-1 bg-brand-gradient rounded-3xl blur opacity-20 pointer-events-none" />
            <WeeklyCalendar
              pitches={pitches}
              initialBookings={bookings}
              subscriptions={subscriptions}
              subscriptionExceptions={subscriptionExceptions}
            />
          </div>
        )}
      </div>
    </div>
  );
}
