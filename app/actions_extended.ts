"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

const COVER_BUCKET = "guardadito-covers";

/**
 * Server action to update user profile information.
 *
 * @param formData - The submitted profile settings details.
 */
export async function updateProfile(formData: FormData) {
  const username = formData.get("username") as string;

  if (!username || username.trim().length === 0) {
    throw new Error("Username cannot be empty");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/profile");
}

/**
 * Server action to delete a specific savings goal.
 * Automatically detaches linked transactions and revalidates dashboard.
 *
 * @param id - The ID of the savings goal to delete.
 */
export async function deleteGuardadito(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error: rpcError } = await supabase.rpc("delete_guardadito_atomic", {
    p_user_id: user.id,
    p_guardadito_id: id,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  revalidatePath("/");
  redirect("/");
}

/**
 * Server action to completely delete the authenticated user's account.
 * Calls RPC function to delete from auth.users (cascading all tables).
 */
export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error } = await supabase.rpc("delete_current_user");

  if (error) {
    throw new Error(error.message);
  }

  await supabase.auth.signOut();

  revalidatePath("/");
  redirect("/login");
}

/**
 * Server action to log out the current user by clearing session cookies.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/");
  redirect("/login");
}

/**
 * Server action to create a new savings goal for the authenticated user.
 *
 * @param formData - Fields: name, icon, target (optional), initialAmount (optional).
 */
export async function createGuardadito(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const icon = (formData.get("icon") as string) || "piggybank";
  const targetStr = formData.get("target") as string | null;
  const initialStr = formData.get("initialAmount") as string | null;
  const coverFile = formData.get("cover_file") as File | null;

  if (!name) {
    throw new Error("El nombre del guardadito es requerido");
  }

  const target = targetStr && targetStr !== "" ? parseFloat(targetStr) : null;
  const initialAmount = initialStr && initialStr !== "" ? parseFloat(initialStr) : 0;

  if (isNaN(initialAmount) || initialAmount < 0) {
    throw new Error("Monto inicial inválido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { data: newGuardaditoId, error: rpcError } = await supabase.rpc("create_guardadito_atomic", {
    p_user_id: user.id,
    p_name: name,
    p_icon: icon,
    p_target: target,
    p_initial_amount: initialAmount,
  });

  if (rpcError || !newGuardaditoId) {
    throw new Error(rpcError?.message || "Error al crear el guardadito");
  }

  // Optionally upload cover image
  if (coverFile && coverFile.size > 0) {
    try {
      const fileExt = coverFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${newGuardaditoId}/cover.${fileExt}`;
      const fileBuffer = Buffer.from(await coverFile.arrayBuffer());

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(COVER_BUCKET)
        .upload(filePath, fileBuffer, { contentType: coverFile.type, upsert: true });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from(COVER_BUCKET).getPublicUrl(uploadData.path);
        await supabase
          .from("guardaditos")
          .update({ cover_url: `${publicUrl}?t=${Date.now()}` })
          .eq("id", newGuardaditoId)
          .eq("user_id", user.id);
      }
    } catch {
      // Non-fatal: guardadito was created, cover image failed silently
    }
  }

  revalidatePath("/");
}


/**
 * Server action to persist a new user-defined transaction category.
 *
 * @param formData - Fields: label, icon.
 */
export async function createCustomCategory(formData: FormData) {
  const label = (formData.get("label") as string)?.trim();
  const icon = (formData.get("icon") as string) || "briefcase";

  if (!label) {
    throw new Error("El nombre de la categoría es requerido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error } = await supabase.from("custom_categories").insert({
    user_id: user.id,
    label,
    icon,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

/**
 * Server action to upload an avatar image to Supabase Storage and update the profile record.
 *
 * @param formData - Expects a "avatar_file" File field.
 */
export async function uploadAvatar(formData: FormData) {
  const avatarFile = formData.get("avatar_file") as File | null;

  if (!avatarFile || avatarFile.size === 0) {
    throw new Error("No file provided");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const fileExt = avatarFile.name.split(".").pop() || "jpg";
  const filePath = `${user.id}/avatar.${fileExt}`;
  const fileBuffer = Buffer.from(await avatarFile.arrayBuffer());

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, fileBuffer, { contentType: avatarFile.type, upsert: true });

  if (uploadError || !uploadData) {
    throw new Error(uploadError?.message || "Upload failed");
  }

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/");
  revalidatePath("/profile");
}

/**
 * Server action to upload (or replace) a cover image for a specific guardadito.
 * Uploads to the `guardadito-covers` Supabase Storage bucket and persists the
 * public URL in the `cover_url` column.
 *
 * @param guardaditoId - The savings goal to attach the cover to.
 * @param formData     - Expects a "cover_file" File field.
 */
export async function uploadGuardaditoCover(guardaditoId: string, formData: FormData) {
  const coverFile = formData.get("cover_file") as File | null;

  if (!coverFile || coverFile.size === 0) {
    throw new Error("No se proporcionó ninguna imagen");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  // Verify the guardadito belongs to the user
  const { data: goal } = await supabase
    .from("guardaditos")
    .select("id")
    .eq("id", guardaditoId)
    .eq("user_id", user.id)
    .single();

  if (!goal) {
    throw new Error("Guardadito no encontrado");
  }

  const fileExt = coverFile.name.split(".").pop() || "jpg";
  const filePath = `${user.id}/${guardaditoId}/cover.${fileExt}`;
  const fileBuffer = Buffer.from(await coverFile.arrayBuffer());

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(filePath, fileBuffer, { contentType: coverFile.type, upsert: true });

  if (uploadError || !uploadData) {
    throw new Error(uploadError?.message || "Error al subir la imagen");
  }

  const { data: { publicUrl } } = supabase.storage.from(COVER_BUCKET).getPublicUrl(uploadData.path);

  // Append cache-busting timestamp so the browser reloads the updated image
  const coverUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("guardaditos")
    .update({ cover_url: coverUrl })
    .eq("id", guardaditoId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/");
  revalidatePath(`/guardaditos/${guardaditoId}`);

  return { coverUrl };
}

/**
 * Server action to update the display settings (position and opacity) of a
 * guardadito cover image.
 *
 * @param guardaditoId - The savings goal unique identifier.
 * @param position     - CSS object-position value, e.g. "center", "top left".
 * @param opacity      - Decimal opacity between 0 and 1.
 */
export async function updateGuardaditoCoverSettings(
  guardaditoId: string,
  position: string,
  opacity: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const clampedOpacity = Math.min(1, Math.max(0, opacity));

  const { error } = await supabase
    .from("guardaditos")
    .update({ cover_position: position, cover_opacity: clampedOpacity })
    .eq("id", guardaditoId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath(`/guardaditos/${guardaditoId}`);
}

/**
 * Server action to remove the cover image from a guardadito (sets cover_url to null).
 *
 * @param guardaditoId - The savings goal unique identifier.
 */
export async function removeGuardaditoCover(guardaditoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error } = await supabase
    .from("guardaditos")
    .update({ cover_url: null })
    .eq("id", guardaditoId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath(`/guardaditos/${guardaditoId}`);
}
