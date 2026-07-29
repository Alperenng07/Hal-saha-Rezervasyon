import { getAdminSubscriptions } from "@/lib/data";
import { getAllPitchesAdmin } from "@/lib/actions/pitches";
import SubscriptionsManager from "./subscriptions-manager";

export default async function AdminSubscriptionsPage() {
  const [subscriptions, pitches] = await Promise.all([
    getAdminSubscriptions(),
    getAllPitchesAdmin(),
  ]);

  return (
    <SubscriptionsManager
      initialSubscriptions={subscriptions.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate?.toISOString() ?? null,
      }))}
      pitches={pitches.filter((p) => p.isActive)}
    />
  );
}
