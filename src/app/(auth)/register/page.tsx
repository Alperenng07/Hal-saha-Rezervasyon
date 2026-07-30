import { getAdminEmailFromSettings } from "@/lib/auth";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
  const adminEmail = await getAdminEmailFromSettings();
  return <RegisterForm adminEmail={adminEmail} />;
}
