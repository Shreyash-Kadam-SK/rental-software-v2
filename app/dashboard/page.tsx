import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/my-bookings");

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const [active, pending, thisMonth, due, collected] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("equipment_out", true)
      .eq("equipment_in", false),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStartStr),
    supabase
      .from("bookings")
      .select("id, order_id, customer_name, end_date")
      .eq("status", "approved")
      .eq("equipment_out", true)
      .eq("equipment_in", false)
      .lt("end_date", today),
    supabase
      .from("bookings")
      .select("price")
      .eq("status", "collected")
      .gte("created_at", monthStartStr),
  ]);

  const earnings =
    collected.data?.reduce((sum, b) => sum + Number(b.price ?? 0), 0) ?? 0;

  const cards = [
    { label: "Active orders", value: active.count ?? 0 },
    { label: "Pending approval", value: pending.count ?? 0 },
    { label: "This month", value: thisMonth.count ?? 0 },
    { label: "Due", value: due.data?.length ?? 0, danger: true },
    { label: "Earnings (month)", value: `₹${earnings.toLocaleString("en-IN")}` },
  ];

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mb-6 flex items-center gap-3 border-b border-neutral-800 pb-4">
        <p className="font-medium">Swaraj Scaffolding & Truss</p>
        <p className="text-sm text-neutral-400">Dashboard</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl p-4 ${
              c.danger ? "bg-red-950" : "bg-neutral-900"
            }`}
          >
            <p className="mb-1 text-xs text-neutral-400">{c.label}</p>
            <p
              className={`text-2xl font-medium ${
                c.danger ? "text-red-400" : "text-white"
              }`}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <p className="mb-2 text-sm text-neutral-400">Due orders</p>
      <div className="overflow-hidden rounded-xl border border-neutral-800">
        {due.data && due.data.length > 0 ? (
          due.data.map((b) => (
            <div
              key={b.id}
              className="flex justify-between border-b border-neutral-800 px-4 py-2 text-sm last:border-b-0"
            >
              <span>
                {b.order_id} · {b.customer_name}
              </span>
              <span className="text-red-400">Overdue since {b.end_date}</span>
            </div>
          ))
        ) : (
          <p className="px-4 py-3 text-sm text-neutral-500">No overdue orders.</p>
        )}
      </div>
    </div>
  );
}