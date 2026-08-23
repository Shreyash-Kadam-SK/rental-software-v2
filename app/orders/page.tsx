import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/actions/authz";
import { markMoneyCollected, markEquipmentOut, markEquipmentIn } from "@/lib/actions/bookings";
import Link from "next/link";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const { status, q } = await searchParams;
  const admin = createAdminClient();

  let query = admin.from("bookings").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);

  const { data: bookings } = await query;

  const tabs = ["all", "pending", "approved", "collected", "cancelled"];

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-4 font-medium">All Orders</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/orders?status=${t}${q ? `&q=${q}` : ""}`}
            className={`rounded-md px-3 py-1 text-sm ${
              (status ?? "all") === t ? "bg-white text-black" : "bg-neutral-900"
            }`}
          >
            {t}
          </Link>
        ))}
        <form action="/orders" method="GET" className="ml-auto">
          <input type="hidden" name="status" value={status ?? "all"} />
          <input name="q" defaultValue={q} placeholder="Search name or phone" className="rounded-md border bg-white p-1 text-sm text-black" />
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800">
        {bookings?.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 px-4 py-2 text-sm last:border-b-0">
            <span>{b.order_id} · {b.customer_name}</span>
            <span className="text-neutral-400">{b.start_date} → {b.end_date}</span>
            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs">{b.status}</span>
            <div className="flex gap-2">
              {b.status === "pending" && (
                <Link href={`/orders/${b.id}/review`} className="text-orange-400">Review</Link>
              )}
              {b.status === "approved" && (
                <>
                  {!b.equipment_out && (
                    <form action={markEquipmentOut.bind(null, b.id)}>
                      <button className="text-blue-400">Equipment out</button>
                    </form>
                  )}
                  {!b.money_collected && (
                    <form action={markMoneyCollected.bind(null, b.id)}>
                      <button className="text-green-400">Money in</button>
                    </form>
                  )}
                  {b.equipment_out && !b.equipment_in && (
                    <form action={markEquipmentIn.bind(null, b.id)}>
                      <button className="text-blue-400">Equipment in</button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {(!bookings || bookings.length === 0) && (
          <p className="px-4 py-3 text-sm text-neutral-500">No orders found.</p>
        )}
      </div>
    </div>
  );
}
