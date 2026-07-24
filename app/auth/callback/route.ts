import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config/admins";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const role = isAdminEmail(user.email) ? "admin" : "customer";
        const { data: profile } = await supabase
          .from("profiles")
          .update({ role, email: user.email })
          .eq("id", user.id)
          .select("phone")
          .single();

        if (!profile?.phone) {
          return NextResponse.redirect(`${origin}/complete-profile`);
        }
        return NextResponse.redirect(
          `${origin}/${role === "admin" ? "dashboard" : "my-bookings"}`
        );
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}