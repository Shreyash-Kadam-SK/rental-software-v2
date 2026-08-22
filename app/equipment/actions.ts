"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
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
}

async function handleImageUpload(admin: ReturnType<typeof createAdminClient>, id: string, file: File) {
  const ext = file.name.split(".").pop();
  const path = `${id}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("equipment-images")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.log("UPLOAD ERROR:", uploadError);
    return;
  }

  const { data: urlData } = admin.storage.from("equipment-images").getPublicUrl(path);
  await admin.from("equipment").update({ image_url: urlData.publicUrl }).eq("id", id);
}

export async function addEquipment(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const total_quantity = Number(formData.get("total_quantity"));
  const file = formData.get("image") as File | null;

  const { data: equipment, error } = await admin
    .from("equipment")
    .insert({ name, description, total_quantity })
    .select("id")
    .single();

  if (error || !equipment) {
    console.log("ADD EQUIPMENT ERROR:", error);
    return;
  }

  if (file && file.size > 0) {
    await handleImageUpload(admin, equipment.id, file);
  }

  revalidatePath("/equipment");
}

export async function updateEquipment(id: string, formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const total_quantity = Number(formData.get("total_quantity"));
  const file = formData.get("image") as File | null;

  await admin.from("equipment").update({ name, description, total_quantity }).eq("id", id);

  if (file && file.size > 0) {
    await handleImageUpload(admin, id, file);
  }

  revalidatePath("/equipment");
}

export async function deleteEquipment(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("equipment").delete().eq("id", id);
  revalidatePath("/equipment");
}