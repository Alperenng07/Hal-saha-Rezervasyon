import { getBusinessSettings } from "@/lib/data";
import SettingsForm from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings();
  return <SettingsForm settings={settings} />;
}
