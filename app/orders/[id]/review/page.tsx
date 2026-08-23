import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/actions/authz";
import ReviewClient from "./ReviewClient";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: booking } = await admin.from("bookings").select("*").eq("id", id).single();
  const { data: items } = await admin
    .from("booking_items")
    .select("quantity, equipment(name)")
    .eq("booking_id", id);

  if (!booking) return <div className="p-6 text-white">Booking not found.</div>;

  return <ReviewClient booking={booking} items={items ?? []} />;
}