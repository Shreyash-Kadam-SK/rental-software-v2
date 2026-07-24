"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CompleteProfilePage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function save() {
    setError("");
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .update({ phone: `+91${phone.replace(/\D/g, "")}` })
      .eq("id", user.id)
      .select("role")
      .single();

    setLoading(false);
    router.push(profile?.role === "admin" ? "/dashboard" : "/my-bookings");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4">
      <h1 className="text-lg font-medium text-white">One more thing — your phone number</h1>
      <p className="max-w-sm text-center text-sm text-gray-400">
        We keep this on file for booking contact and WhatsApp updates.
      </p>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <input
          type="tel"
          placeholder="10-digit phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-md border p-3"
        />
        <button
          onClick={save}
          disabled={loading || phone.length < 10}
          className="rounded-md bg-orange-500 p-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}