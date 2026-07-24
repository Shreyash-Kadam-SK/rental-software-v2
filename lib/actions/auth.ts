"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminPhone } from "@/lib/config/admins";
import { redirect } from "next/navigation";

export async function syncRoleAndRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.phone) {
    redirect("/login");
  }

  const role = isAdminPhone(user.phone) ? "admin" : "customer";

  await supabase.from("profiles").update({ role }).eq("id", user.id);

  redirect(role === "admin" ? "/dashboard" : "/my-bookings");
}