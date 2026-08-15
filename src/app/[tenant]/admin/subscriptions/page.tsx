import { notFound } from "next/navigation";
import { getAdminSubscriptions } from "@/lib/data";
import { getAllPitchesAdmin } from "@/lib/actions/pitches";
import { getTenantSettings } from "@/lib/data";
import SubscriptionsManager from "./subscriptions-manager";

type Props = { params: Promise<{ tenant: string }> };

export default async function AdminSubscriptionsPage({ params }: Props) {
  const { tenant: tenantSlug } = await params;
  const settings = await getTenantSettings(tenantSlug);
  if (!settings) notFound();

  const [subscriptions, pitches] = await Promise.all([
    getAdminSubscriptions(settings.id),
    getAllPitchesAdmin(tenantSlug),
  ]);

  return (
    <SubscriptionsManager
      tenantSlug={tenantSlug}
      initialSubscriptions={subscriptions.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate?.toISOString() ?? null,
      }))}
      pitches={pitches.filter((p) => p.isActive)}
    />
  );
}
