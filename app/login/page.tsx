"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncRoleAndRedirect } from "@/lib/actions/auth";
import Image from "next/image";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function sendOtp() {
    setError("");
    setLoading(true);
    const fullPhone = `+91${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("otp");
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);
    const fullPhone = `+91${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    await syncRoleAndRedirect();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-4">
      <Image src="/logo.png" alt="Swaraj Scaffolding & Truss" width={100} height={100} />
      <h1 className="text-xl font-semibold text-white">Swaraj Scaffolding & Truss</h1>

      {step === "phone" && (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <input
            type="tel"
            placeholder="10-digit phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border p-3"
          />
          <button
            onClick={sendOtp}
            disabled={loading || phone.length < 10}
            className="rounded-md bg-orange-500 p-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="rounded-md border p-3"
          />
          <button
            onClick={verifyOtp}
            disabled={loading || otp.length < 4}
            className="rounded-md bg-orange-500 p-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}