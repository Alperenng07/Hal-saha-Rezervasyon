import { notFound } from "next/navigation";
import { getActiveTenantBySlug } from "@/lib/tenant";
import LoginForm from "./login-form";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function TenantLoginPage({ params }: Props) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getActiveTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-3 py-10">
      <LoginForm tenantSlug={tenantSlug} adminEmail={tenant.adminEmail} businessName={tenant.name} />
    </div>
  );
}
