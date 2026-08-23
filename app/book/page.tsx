"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createBooking } from "@/lib/actions/bookings";
import { buildWhatsAppLink } from "@/lib/actions/whatsapp";

type Equipment = { id: string; name: string };
type Row = { equipment_id: string; quantity: number };

export default function BookPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rows, setRows] = useState<Row[]>([{ equipment_id: "", quantity: 1 }]);
  const [result, setResult] = useState<{ orderId: string; waLink: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("equipment").select("id, name").then(({ data }) => setEquipment(data ?? []));
  }, []);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function submit() {
    setError("");
    setLoading(true);
    const validRows = rows.filter((r) => r.equipment_id && r.quantity > 0);
    const res = await createBooking({ name, phone, startDate, endDate, items: validRows });
    setLoading(false);
    if (res.error || !res.orderId) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    setResult({ orderId: res.orderId, waLink: buildWhatsAppLink(res.phone!, res.message!) });
  }

  if (result) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 text-white">
      <h1 className="text-lg font-medium">Booking submitted!</h1>
      <p className="text-neutral-400">Order ID: {result.orderId}</p>
      
      <a
        href={result.waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium"
      >
        Send WhatsApp confirmation
      </a>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-4 font-medium">New Booking</h1>
      <div className="flex max-w-md flex-col gap-3">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border bg-white p-2 text-sm text-black" />
        <input placeholder="10-digit phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-md border bg-white p-2 text-sm text-black" />

        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <select
              value={row.equipment_id}
              onChange={(e) => updateRow(i, { equipment_id: e.target.value })}
              className="flex-1 rounded-md border bg-white p-2 text-sm text-black"
            >
              <option value="">Select equipment</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={row.quantity}
              onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
              className="w-20 rounded-md border bg-white p-2 text-sm text-black"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((r) => [...r, { equipment_id: "", quantity: 1 }])}
          className="self-start text-sm text-orange-400"
        >
          + Add equipment
        </button>

        <div className="flex gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 rounded-md border bg-white p-2 text-sm text-black" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 rounded-md border bg-white p-2 text-sm text-black" />
        </div>

        <button
          onClick={submit}
          disabled={loading || !name || phone.length < 10 || !startDate || !endDate}
          className="rounded-md bg-orange-500 p-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit booking request"}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}