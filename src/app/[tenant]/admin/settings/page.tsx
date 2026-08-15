import { notFound } from "next/navigation";
import { getTenantSettings } from "@/lib/data";
import SettingsForm from "./settings-form";

type Props = { params: Promise<{ tenant: string }> };

export default async function AdminSettingsPage({ params }: Props) {
  const { tenant: tenantSlug } = await params;
  const settings = await getTenantSettings(tenantSlug);
  if (!settings) notFound();

  return <SettingsForm tenantSlug={tenantSlug} settings={settings} />;
}
