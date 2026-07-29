"use server";

import { createClient } from "@/lib/supabase/server";
import { syncUserFromSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function syncUserAction() {
  await syncUserFromSession();
  revalidatePath("/", "layout");
}
