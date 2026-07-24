"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admins";
import { redirect } from "next/navigation";

export async function syncRoleAndRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const role = isAdminEmail(user.email) ? "admin" : "customer";

  const { data: profile } = await supabase
    .from("profiles")
    .update({ role, email: user.email })
    .eq("id", user.id)
    .select("phone")
    .single();

  if (!profile?.phone) {
    redirect("/complete-profile");
  }

  redirect(role === "admin" ? "/dashboard" : "/my-bookings");
}