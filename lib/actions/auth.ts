"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .upsert({ id: user.id, email: user.email, role }, { onConflict: "id" })
    .select("phone")
    .single();

  if (error) {
    console.log("UPSERT ERROR:", JSON.stringify(error, null, 2));
  }

  if (!profile?.phone) {
    redirect("/complete-profile");
  }

  redirect(role === "admin" ? "/dashboard" : "/my-bookings");
}