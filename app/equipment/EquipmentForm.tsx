"use client";

import { addEquipment, updateEquipment } from "./actions";

type Equipment = {
  id: string;
  name: string;
  description: string | null;
  total_quantity: number;
};

export default function EquipmentForm({
  mode,
  equipment,
}: {
  mode: "add" | "edit";
  equipment?: Equipment;
}) {
  const action = mode === "add" ? addEquipment : updateEquipment.bind(null, equipment!.id);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input
        name="name"
        placeholder="Equipment name"
        defaultValue={equipment?.name}
        required
        className="rounded-md border bg-white p-2 text-sm text-black placeholder:text-neutral-500"
      />
      <textarea
        name="description"
        placeholder="Description"
        defaultValue={equipment?.description ?? ""}
        className="rounded-md border bg-white p-2 text-sm text-black placeholder:text-neutral-500"
      />
      <input
        name="total_quantity"
        type="number"
        placeholder="Total quantity"
        defaultValue={equipment?.total_quantity}
        required
        min={0}
        className="rounded-md border bg-white p-2 text-sm text-black placeholder:text-neutral-500"
      />
      <div>
        <label className="text-xs text-neutral-400">Image (optional)</label>
        <input name="image" type="file" accept="image/*" className="block text-sm text-neutral-400" />
      </div>
      <button
        type="submit"
        className="rounded-md bg-orange-500 p-2 text-sm font-medium text-white"
      >
        {mode === "add" ? "Add Equipment" : "Save changes"}
      </button>
    </form>
  );
}