"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

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

  // Fetch guardadito's balance before deletion to return it back to user balance?
  // Let's check how the user wants to handle this. Returning balance back is nice,
  // but let's simply delete the goal to keep it clean and robust.
  const { data: goal } = await supabase
    .from("guardaditos")
    .select("current")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!goal) {
    throw new Error("Savings goal not found");
  }

  // Return savings back to portfolio balance
  const savingsAmt = parseFloat(goal.current.toString());
  if (savingsAmt > 0) {
    const { data: portfolio } = await supabase
      .from("portfolios")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (portfolio) {
      const currentPortVal = parseFloat(portfolio.balance.toString());
      await supabase
        .from("portfolios")
        .update({ balance: currentPortVal + savingsAmt })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("portfolios")
        .insert({ user_id: user.id, balance: savingsAmt, change_percent: 0.00, is_positive: true });
    }
  }

  const { error } = await supabase
    .from("guardaditos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
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

  // If initialAmount > 0, validate wallet balance
  let currentBalance = 0;
  let hasPortfolio = false;
  if (initialAmount > 0) {
    const { data: portfolio, error: fetchPortError } = await supabase
      .from("portfolios")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchPortError) {
      throw new Error(fetchPortError.message);
    }

    if (portfolio) {
      currentBalance = parseFloat(portfolio.balance.toString());
      hasPortfolio = true;
    }

    if (currentBalance < initialAmount) {
      throw new Error("Fondos insuficientes en tu billetera para el monto inicial");
    }
  }

  const { data: existing } = await supabase
    .from("guardaditos")
    .select("theme_index")
    .eq("user_id", user.id)
    .order("theme_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextTheme = existing ? (existing.theme_index + 1) % 3 : 0;

  const { data: newGuardadito, error: insertGError } = await supabase
    .from("guardaditos")
    .insert({
      user_id: user.id,
      name,
      icon,
      current: initialAmount,
      target,
      theme_index: nextTheme,
    })
    .select("id")
    .single();

  if (insertGError || !newGuardadito) {
    throw new Error(insertGError?.message || "Error al crear el guardadito");
  }

  // If initialAmount > 0, update wallet balance and create transaction log
  if (initialAmount > 0) {
    const newBalance = currentBalance - initialAmount;
    if (hasPortfolio) {
      const { error: updatePortError } = await supabase
        .from("portfolios")
        .update({ balance: newBalance })
        .eq("user_id", user.id);
      if (updatePortError) {
        throw new Error(updatePortError.message);
      }
    } else {
      const { error: insertPortError } = await supabase
        .from("portfolios")
        .insert({ user_id: user.id, balance: newBalance, change_percent: 0.00, is_positive: true });
      if (insertPortError) {
        throw new Error(insertPortError.message);
      }
    }

    const title = `Ahorro: ${name}`;
    const subtitle = "Goal Deposit • Today";

    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      icon: icon,
      title: title,
      subtitle: subtitle,
      amount: initialAmount,
      is_positive: false,
      status: "COMPLETED",
      guardadito_id: newGuardadito.id,
    });

    if (txError) {
      throw new Error(txError.message);
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
