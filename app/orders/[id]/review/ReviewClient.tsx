"use client";

import { useState } from "react";
import { approveBooking, cancelBooking } from "@/lib/actions/bookings";
import { buildWhatsAppLink } from "@/lib/actions/whatsapp";

export default function ReviewClient({ booking, items }: { booking: any; items: any[] }) {
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState<"out_of_stock" | "staff_unavailable" | "other">("out_of_stock");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ waLink: string } | null>(null);

  async function approve() {
    setError("");
    const res = await approveBooking(booking.id, Number(price), description);
    if (res.error) return setError(res.error);
    setResult({ waLink: buildWhatsAppLink(res.phone!, res.message!) });
  }

  async function cancel() {
    setError("");
    const res = await cancelBooking(booking.id, reason, note, description);
    if (res.error) return setError(res.error);
    setResult({ waLink: buildWhatsAppLink(res.phone!, res.message!) });
  }

  if (result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 text-white">
        <p>Done — order updated.</p>
        <a href={result.waLink} target="_blank" className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium">
          Send WhatsApp update
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-2 font-medium">{booking.order_id}</h1>
      <p className="text-sm text-neutral-400">{booking.customer_name} · {booking.customer_phone}</p>
      <p className="text-sm text-neutral-400">{booking.start_date} → {booking.end_date}</p>

      <div className="my-4 rounded-xl border border-neutral-800 p-3">
        {items.map((it, i) => (
          <p key={i} className="text-sm">{it.equipment?.name} × {it.quantity}</p>
        ))}
      </div>

      <div className="mb-6 max-w-sm rounded-xl border border-green-900 p-4">
        <p className="mb-2 text-sm font-medium">Approve</p>
        <input placeholder="Price (₹)" value={price} onChange={(e) => setPrice(e.target.value)} className="mb-2 w-full rounded-md border bg-white p-2 text-sm text-black" />
        <input placeholder="Description / note" value={description} onChange={(e) => setDescription(e.target.value)} className="mb-2 w-full rounded-md border bg-white p-2 text-sm text-black" />
        <button onClick={approve} className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium">Approve</button>
      </div>

      <div className="max-w-sm rounded-xl border border-red-900 p-4">
        <p className="mb-2 text-sm font-medium">Cancel</p>
        <select value={reason} onChange={(e) => setReason(e.target.value as any)} className="mb-2 w-full rounded-md border bg-white p-2 text-sm text-black">
          <option value="out_of_stock">Not in stock</option>
          <option value="staff_unavailable">Employees not available</option>
          <option value="other">Other</option>
        </select>
        <input placeholder="Note (required for 'Other')" value={note} onChange={(e) => setNote(e.target.value)} className="mb-2 w-full rounded-md border bg-white p-2 text-sm text-black" />
        <button onClick={cancel} className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium">Cancel Booking</button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}