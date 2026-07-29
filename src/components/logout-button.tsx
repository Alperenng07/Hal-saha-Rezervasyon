"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncUserAction } from "@/lib/actions/auth";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    await syncUserAction();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
    >
      Çıkış Yap
    </button>
  );
}
