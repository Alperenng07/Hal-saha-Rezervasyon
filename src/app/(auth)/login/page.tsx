import { getAdminEmailFromSettings } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const adminEmail = await getAdminEmailFromSettings();
  return <LoginForm adminEmail={adminEmail} />;
}
