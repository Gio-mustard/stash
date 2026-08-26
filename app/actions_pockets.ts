"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

/**
 * Server action to create a new pocket.
 * The initial balance is treated as external money (increases total balance).
 */
export async function createPocket(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const subtitle = (formData.get("subtitle") as string)?.trim() || null;
  const balanceStr = formData.get("balance") as string | null;
  const designPreset = (formData.get("design_preset") as string) || "emerald-dark";
  const customDesignStr = formData.get("custom_design") as string | null;

  if (!name) {
    throw new Error("El nombre de la tarjeta es requerido");
  }

  const balance = balanceStr && balanceStr !== "" ? parseFloat(balanceStr) : 0;
  if (isNaN(balance) || balance < 0) {
    throw new Error("Saldo inicial inválido");
  }

  let customDesign = null;
  if (customDesignStr) {
    try {
      customDesign = JSON.parse(customDesignStr);
    } catch {
      throw new Error("El diseño personalizado es inválido");
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error: rpcError } = await supabase.rpc("create_pocket_atomic", {
    p_user_id: user.id,
    p_name: name,
    p_subtitle: subtitle,
    p_balance: balance,
    p_design_preset: designPreset,
    p_custom_design: customDesign,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  revalidatePath("/");
  revalidatePath("/wallet");
}

/**
 * Server action to update pocket details (name, subtitle, design).
 */
export async function updatePocket(
  id: string,
  name: string,
  subtitle: string | null,
  designPreset: string,
  customDesign: any | null
) {
  if (!name.trim()) {
    throw new Error("El nombre de la tarjeta es requerido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error } = await supabase
    .from("pockets")
    .update({
      name: name.trim(),
      subtitle: subtitle?.trim() || null,
      design_preset: designPreset,
      custom_design: customDesign,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath(`/wallet/${id}`);
}

/**
 * Server action to delete a pocket.
 * If transferToWallet is true, transfers the pocket's balance to the general portfolio.
 */
export async function deletePocket(id: string, transferToWallet: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error: rpcError } = await supabase.rpc("delete_pocket_atomic", {
    p_user_id: user.id,
    p_pocket_id: id,
    p_transfer_to_wallet: transferToWallet,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  revalidatePath("/");
  revalidatePath("/wallet");
  redirect("/wallet");
}

/**
 * Server action to deposit money directly into a pocket (income).
 */
export async function pocketDeposit(
  id: string,
  amount: number,
  category: string,
  note: string,
  dateStr?: string
) {
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Monto inválido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { data: pocket } = await supabase
    .from("pockets")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!pocket) {
    throw new Error("Pocket no encontrado");
  }

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const title = note.trim() || `Ingreso: ${pocket.name}`;
  const txDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
  const subtitle = `${categoryLabel} • ${new Date(txDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`;

  const { error: rpcError } = await supabase.rpc("pocket_deposit_atomic", {
    p_user_id: user.id,
    p_pocket_id: id,
    p_amount: amount,
    p_icon: category,
    p_title: title,
    p_subtitle: subtitle,
    p_created_at: txDate,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath(`/wallet/${id}`);
}

/**
 * Server action to record a spend from a pocket (expense).
 */
export async function pocketExpense(
  id: string,
  amount: number,
  category: string,
  note: string,
  dateStr?: string
) {
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Monto inválido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { data: pocket } = await supabase
    .from("pockets")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!pocket) {
    throw new Error("Pocket no encontrado");
  }

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const title = note.trim() || `Gasto: ${pocket.name}`;
  const txDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
  const subtitle = `${categoryLabel} • ${new Date(txDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`;

  const { error: rpcError } = await supabase.rpc("pocket_expense_atomic", {
    p_user_id: user.id,
    p_pocket_id: id,
    p_amount: amount,
    p_icon: category,
    p_title: title,
    p_subtitle: subtitle,
    p_created_at: txDate,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath(`/wallet/${id}`);
}

/**
 * Server action to transfer money from a pocket to the main wallet balance.
 */
export async function transferPocketToWallet(pocketId: string, amount: number) {
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Monto inválido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { data: pocket } = await supabase
    .from("pockets")
    .select("name")
    .eq("id", pocketId)
    .eq("user_id", user.id)
    .single();

  if (!pocket) {
    throw new Error("Pocket no encontrado");
  }

  const { error: rpcError } = await supabase.rpc("transfer_pocket_to_wallet_atomic", {
    p_user_id: user.id,
    p_pocket_id: pocketId,
    p_amount: amount,
    p_title: `Retiro: ${pocket.name}`,
    p_subtitle: `Transfer to Wallet • Today`,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath(`/wallet/${pocketId}`);
}

/**
 * Server action to transfer money from a pocket to a guardadito.
 */
export async function transferPocketToGuardadito(
  pocketId: string,
  guardaditoId: string,
  amount: number
) {
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Monto inválido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { data: pocket } = await supabase
    .from("pockets")
    .select("name")
    .eq("id", pocketId)
    .eq("user_id", user.id)
    .single();

  if (!pocket) {
    throw new Error("Pocket no encontrado");
  }

  const { data: guardadito } = await supabase
    .from("guardaditos")
    .select("name, icon")
    .eq("id", guardaditoId)
    .eq("user_id", user.id)
    .single();

  if (!guardadito) {
    throw new Error("Guardadito no encontrado");
  }

  // Log transfer transaction: shows as an expense since it's going into a savings target (similar to wallet -> guardadito)
  const { error: rpcError } = await supabase.rpc("transfer_pocket_to_guardadito_atomic", {
    p_user_id: user.id,
    p_pocket_id: pocketId,
    p_guardadito_id: guardaditoId,
    p_amount: amount,
    p_icon: guardadito.icon || "piggybank",
    p_title: `Ahorro: ${guardadito.name}`,
    p_subtitle: `From Pocket: ${pocket.name}`,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath(`/wallet/${pocketId}`);
  revalidatePath(`/guardaditos/${guardaditoId}`);
}

/**
 * Server action to save a custom pocket design (style) for reuse.
 */
export async function createPocketDesign(name: string, design: any) {
  if (!name.trim()) {
    throw new Error("El nombre del estilo es requerido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { data, error } = await supabase
    .from("pocket_designs")
    .insert({
      user_id: user.id,
      name: name.trim(),
      design,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/wallet/custom-design");
  return data;
}

/**
 * Server action to update an existing custom pocket design (style).
 */
export async function updatePocketDesign(id: string, name: string, design: any) {
  if (!name.trim()) {
    throw new Error("El nombre del estilo es requerido");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { data, error } = await supabase
    .from("pocket_designs")
    .update({
      name: name.trim(),
      design,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/wallet/custom-design");
  return data;
}

/**
 * Server action to load user's custom pocket designs.
 */
export async function getPocketDesigns() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("pocket_designs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Server action to upload an image to Supabase Storage for pocket background.
 */
export async function uploadPocketBackground(formData: FormData) {
  const file = formData.get("bg_file") as File | null;

  if (!file || file.size === 0) {
    throw new Error("No se proporcionó ningún archivo");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const filePath = `${user.id}/${Date.now()}.${fileExt}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("pocket-backgrounds")
    .upload(filePath, fileBuffer, { contentType: file.type, upsert: true });

  if (uploadError || !uploadData) {
    throw new Error(uploadError?.message || "Error al subir la imagen");
  }

  const { data: { publicUrl } } = supabase.storage.from("pocket-backgrounds").getPublicUrl(uploadData.path);
  return publicUrl;
}


