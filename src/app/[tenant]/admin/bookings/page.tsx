import { notFound } from "next/navigation";
import { getAdminBookings, getTenantSettings } from "@/lib/data";
import { getAllPitchesAdmin } from "@/lib/actions/pitches";
import BookingsManager from "./bookings-manager";

type Props = { params: Promise<{ tenant: string }> };

export default async function AdminBookingsPage({ params }: Props) {
  const { tenant: tenantSlug } = await params;
  const settings = await getTenantSettings(tenantSlug);
  if (!settings) notFound();

  const [bookings, pitches] = await Promise.all([
    getAdminBookings(settings.id),
    getAllPitchesAdmin(tenantSlug),
  ]);

  return (
    <BookingsManager
      tenantSlug={tenantSlug}
      initialBookings={bookings.map((b) => ({
        ...b,
        date: b.date.toISOString(),
      }))}
      pitches={pitches.filter((p) => p.isActive)}
    />
  );
}
