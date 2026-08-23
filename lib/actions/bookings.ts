"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/actions/authz";
import { revalidatePath } from "next/cache";

type BookingItemInput = { equipment_id: string; quantity: number };

export async function createBooking(input: {
  name: string;
  phone: string;
  startDate: string;
  endDate: string;
  items: BookingItemInput[];
}) {
  const admin = createAdminClient();
  const fullPhone = `+91${input.phone.replace(/\D/g, "")}`;

  const { data: orderId } = await admin.rpc("generate_order_id", { p_phone: fullPhone });

  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      order_id: orderId,
      customer_name: input.name,
      customer_phone: fullPhone,
      start_date: input.startDate,
      end_date: input.endDate,
      status: "pending",
    })
    .select("id, order_id")
    .single();

  if (error || !booking) {
    console.log("CREATE BOOKING ERROR:", error);
    return { error: "Could not create booking. Please try again." };
  }

  const itemRows = input.items.map((i) => ({
    booking_id: booking.id,
    equipment_id: i.equipment_id,
    quantity: i.quantity,
  }));
  await admin.from("booking_items").insert(itemRows);

  const message = `Hi ${input.name}, your booking request (${booking.order_id}) for ${input.startDate} to ${input.endDate} has been received and is pending approval. — Swaraj Scaffolding & Truss`;

  await admin.from("booking_status_log").insert({
    booking_id: booking.id,
    status: "pending",
    message_sent: message,
  });

  return { orderId: booking.order_id, phone: fullPhone, message };
}

export async function approveBooking(bookingId: string, price: number, description: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("start_date, end_date, customer_name, customer_phone, order_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return { error: "Booking not found." };

  const { data: items } = await admin
    .from("booking_items")
    .select("equipment_id, quantity, equipment(name)")
    .eq("booking_id", bookingId);

  for (const item of items ?? []) {
    const { data: available } = await admin.rpc("available_quantity", {
      p_equipment_id: item.equipment_id,
      p_start: booking.start_date,
      p_end: booking.end_date,
      p_exclude_booking_id: bookingId,
    });
    if ((available ?? 0) < item.quantity) {
      const name = (item.equipment as unknown as { name: string })?.name ?? "an item";
      return { error: `Not enough stock for ${name}. Only ${available} available for these dates.` };
    }
  }

  await admin
    .from("bookings")
    .update({ status: "approved", price, admin_description: description })
    .eq("id", bookingId);

  const message = `Hi ${booking.customer_name}, your booking ${booking.order_id} is approved! Price: ₹${price}. ${description} — Swaraj Scaffolding & Truss`;
  await admin.from("booking_status_log").insert({ booking_id: bookingId, status: "approved", message_sent: message });

  revalidatePath("/orders");
  return { message, phone: booking.customer_phone };
}

export async function cancelBooking(
  bookingId: string,
  reason: "out_of_stock" | "staff_unavailable" | "other",
  note: string,
  description: string
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("customer_name, customer_phone, order_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return { error: "Booking not found." };

  await admin
    .from("bookings")
    .update({ status: "cancelled", cancel_reason: reason, cancel_reason_note: note, admin_description: description })
    .eq("id", bookingId);

  const message = `Hi ${booking.customer_name}, your booking ${booking.order_id} was cancelled. Reason: ${reason.replace("_", " ")}. ${description} — Swaraj Scaffolding & Truss`;
  await admin.from("booking_status_log").insert({ booking_id: bookingId, status: "cancelled", message_sent: message });

  revalidatePath("/orders");
  return { message, phone: booking.customer_phone };
}

export async function markMoneyCollected(bookingId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("bookings").update({ money_collected: true }).eq("id", bookingId);
  await maybeMarkCollected(bookingId);
  revalidatePath("/orders");
}

export async function markEquipmentOut(bookingId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("bookings").update({ equipment_out: true }).eq("id", bookingId);
  revalidatePath("/orders");
}

export async function markEquipmentIn(bookingId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("bookings").update({ equipment_in: true }).eq("id", bookingId);
  await maybeMarkCollected(bookingId);
  revalidatePath("/orders");
}

async function maybeMarkCollected(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("money_collected, equipment_in")
    .eq("id", bookingId)
    .single();
  if (booking?.money_collected && booking?.equipment_in) {
    await admin.from("bookings").update({ status: "collected" }).eq("id", bookingId);
  }
}