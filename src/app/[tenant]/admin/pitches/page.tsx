import { notFound } from "next/navigation";
import { getAllPitchesAdmin } from "@/lib/actions/pitches";
import { getTenantSettings } from "@/lib/data";
import PitchesManager from "./pitches-manager";

type Props = { params: Promise<{ tenant: string }> };

export default async function AdminPitchesPage({ params }: Props) {
  const { tenant: tenantSlug } = await params;
  const settings = await getTenantSettings(tenantSlug);
  if (!settings) notFound();

  const pitches = await getAllPitchesAdmin(tenantSlug);
  return <PitchesManager tenantSlug={tenantSlug} initialPitches={pitches} />;
}
