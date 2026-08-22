import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-950 text-yellow-400",
  approved: "bg-green-950 text-green-400",
  collected: "bg-neutral-800 text-neutral-400",
  cancelled: "bg-red-950 text-red-400",
};

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/dashboard");
  if (!profile?.phone) redirect("/complete-profile");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, order_id, start_date, end_date, status, price, admin_description, cancel_reason")
    .eq("customer_phone", profile.phone)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mb-6 flex items-center gap-3 border-b border-neutral-800 pb-4">
        <p className="font-medium">Swaraj Scaffolding & Truss</p>
        <p className="text-sm text-neutral-400">My Bookings</p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <p className="text-sm text-neutral-500">You have no bookings yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-neutral-800 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-sm text-neutral-400">{b.order_id}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    statusColors[b.status] ?? "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <p className="text-sm text-neutral-300">
                {b.start_date} → {b.end_date}
              </p>
              {b.price && <p className="mt-1 text-sm">Price: ₹{b.price}</p>}
              {b.admin_description && (
                <p className="mt-1 text-sm text-neutral-400">{b.admin_description}</p>
              )}
              {b.cancel_reason && (
                <p className="mt-1 text-sm text-red-400">Reason: {b.cancel_reason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}