import { getAdminBookings } from "@/lib/data";
import { getAllPitchesAdmin } from "@/lib/actions/pitches";
import BookingsManager from "./bookings-manager";

export default async function AdminBookingsPage() {
  const [bookings, pitches] = await Promise.all([
    getAdminBookings(),
    getAllPitchesAdmin(),
  ]);

  return (
    <BookingsManager
      initialBookings={bookings.map((b) => ({
        ...b,
        date: b.date.toISOString(),
      }))}
      pitches={pitches.filter((p) => p.isActive)}
    />
  );
}
