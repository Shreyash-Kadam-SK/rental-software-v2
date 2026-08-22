import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Image from "next/image";
import EquipmentForm from "./EquipmentForm";
import { deleteEquipment } from "./actions";

export default async function EquipmentPage() {
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

  const admin = createAdminClient();
  const { data: equipment } = await admin
    .from("equipment")
    .select("*")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const withAvailability = await Promise.all(
    (equipment ?? []).map(async (eq) => {
      const { data: available } = await admin.rpc("available_quantity", {
        p_equipment_id: eq.id,
        p_start: today,
        p_end: today,
      });
      return { ...eq, available: available ?? eq.total_quantity };
    })
  );

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mb-6 border-b border-neutral-800 pb-4">
        <p className="font-medium">Swaraj Scaffolding & Truss</p>
        <p className="text-sm text-neutral-400">Equipment</p>
      </div>

      <details className="mb-6 rounded-xl border border-neutral-800 p-4">
        <summary className="cursor-pointer text-sm font-medium">+ Add new equipment</summary>
        <div className="mt-4">
          <EquipmentForm mode="add" />
        </div>
      </details>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {withAvailability.map((eq) => (
          <div key={eq.id} className="overflow-hidden rounded-xl border border-neutral-800">
            <div className="flex h-36 items-center justify-center bg-neutral-900">
              {eq.image_url ? (
                <Image
                  src={eq.image_url}
                  alt={eq.name}
                  width={300}
                  height={144}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <span className="text-sm text-neutral-500">No image</span>
              )}
            </div>
            <div className="p-4">
              <p className="font-medium">{eq.name}</p>
              <p className="text-sm text-neutral-400">{eq.description}</p>
              <p className="mt-2 text-sm">
                <span className={eq.available <= 0 ? "text-red-400" : "text-green-400"}>
                  {eq.available}
                </span>{" "}
                / {eq.total_quantity} available
              </p>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-neutral-400">Edit</summary>
                <div className="mt-2">
                  <EquipmentForm mode="edit" equipment={eq} />
                </div>
              </details>

              <form action={deleteEquipment.bind(null, eq.id)} className="mt-2">
                <button type="submit" className="text-xs text-red-400">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}

        {withAvailability.length === 0 && (
          <p className="text-sm text-neutral-500">No equipment added yet.</p>
        )}
      </div>
    </div>
  );
}