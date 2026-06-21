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

  // Get next sort order
  const { data: existing } = await supabase
    .from("pockets")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = existing ? existing.sort_order + 1 : 0;

  const { data: newPocket, error: insertError } = await supabase
    .from("pockets")
    .insert({
      user_id: user.id,
      name,
      subtitle,
      balance,
      design_preset: designPreset,
      custom_design: customDesign,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (insertError || !newPocket) {
    throw new Error(insertError?.message || "Error al crear la tarjeta");
  }

  // If initial balance > 0, log a transaction
  if (balance > 0) {
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      icon: "wallet",
      title: `Saldo inicial: ${name}`,
      subtitle: `Pocket Deposit • Today`,
      amount: balance,
      is_positive: true,
      status: "COMPLETED",
      pocket_id: newPocket.id,
    });

    if (txError) {
      throw new Error("Error al registrar transacción de saldo inicial: " + txError.message);
    }
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

  const { data: pocket } = await supabase
    .from("pockets")
    .select("name, balance")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!pocket) {
    throw new Error("Pocket no encontrado");
  }

  const pocketBalance = parseFloat(pocket.balance.toString());

  if (transferToWallet && pocketBalance > 0) {
    // Fetch user portfolio
    const { data: portfolio } = await supabase
      .from("portfolios")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentBalance = portfolio ? parseFloat(portfolio.balance.toString()) : 0;
    const newBalance = currentBalance + pocketBalance;

    if (portfolio) {
      await supabase
        .from("portfolios")
        .update({ balance: newBalance })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("portfolios")
        .insert({ user_id: user.id, balance: newBalance, change_percent: 0.00, is_positive: true });
    }

    // Log the transfer transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      icon: "wallet",
      title: `Cierre: ${pocket.name}`,
      subtitle: `Transfer to Wallet • Today`,
      amount: pocketBalance,
      is_positive: true,
      status: "COMPLETED",
    });
  }

  const { error } = await supabase
    .from("pockets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
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
    .select("name, balance")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!pocket) {
    throw new Error("Pocket no encontrado");
  }

  const currentBalance = parseFloat(pocket.balance.toString());
  const newBalance = currentBalance + amount;

  const { error: updateError } = await supabase
    .from("pockets")
    .update({ balance: newBalance })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const title = note.trim() || `Ingreso: ${pocket.name}`;
  const txDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
  const subtitle = `${categoryLabel} • ${new Date(txDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`;

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    icon: category,
    title,
    subtitle,
    amount,
    is_positive: true,
    status: "COMPLETED",
    pocket_id: id,
    created_at: txDate,
  });

  if (txError) {
    throw new Error(txError.message);
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
    .select("name, balance")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!pocket) {
    throw new Error("Pocket no encontrado");
  }

  const currentBalance = parseFloat(pocket.balance.toString());
  if (currentBalance < amount) {
    throw new Error("Fondos insuficientes en esta tarjeta");
  }

  const newBalance = currentBalance - amount;

  const { error: updateError } = await supabase
    .from("pockets")
    .update({ balance: newBalance })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const title = note.trim() || `Gasto: ${pocket.name}`;
  const txDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
  const subtitle = `${categoryLabel} • ${new Date(txDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`;

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    icon: category,
    title,
    subtitle,
    amount,
    is_positive: false,
    status: "COMPLETED",
    pocket_id: id,
    created_at: txDate,
  });

  if (txError) {
    throw new Error(txError.message);
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
    .select("name, balance")
    .eq("id", pocketId)
    .eq("user_id", user.id)
    .single();

  if (!pocket) {
    throw new Error("Pocket no encontrado");
  }

  const currentPocketBalance = parseFloat(pocket.balance.toString());
  if (currentPocketBalance < amount) {
    throw new Error("Fondos insuficientes en esta tarjeta");
  }

  // Get portfolio
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentPortBalance = portfolio ? parseFloat(portfolio.balance.toString()) : 0;

  // Deduct from pocket
  const { error: updatePocketError } = await supabase
    .from("pockets")
    .update({ balance: currentPocketBalance - amount })
    .eq("id", pocketId)
    .eq("user_id", user.id);

  if (updatePocketError) {
    throw new Error(updatePocketError.message);
  }

  // Add to portfolio
  if (portfolio) {
    await supabase
      .from("portfolios")
      .update({ balance: currentPortBalance + amount })
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("portfolios")
      .insert({ user_id: user.id, balance: amount, change_percent: 0.00, is_positive: true });
  }

  // Log transfer transaction: shows as a positive entry in wallet history, but linked to the pocket
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    icon: "wallet",
    title: `Retiro: ${pocket.name}`,
    subtitle: `Transfer to Wallet • Today`,
    amount,
    is_positive: true,
    status: "COMPLETED",
    pocket_id: pocketId,
  });

  if (txError) {
    throw new Error(txError.message);
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
    .select("name, balance")
    .eq("id", pocketId)
    .eq("user_id", user.id)
    .single();

  if (!pocket) {
    throw new Error("Pocket no encontrado");
  }

  const { data: guardadito } = await supabase
    .from("guardaditos")
    .select("name, icon, current")
    .eq("id", guardaditoId)
    .eq("user_id", user.id)
    .single();

  if (!guardadito) {
    throw new Error("Guardadito no encontrado");
  }

  const currentPocketBalance = parseFloat(pocket.balance.toString());
  if (currentPocketBalance < amount) {
    throw new Error("Fondos insuficientes en la tarjeta");
  }

  const currentSavings = parseFloat(guardadito.current.toString());

  // Deduct from pocket
  const { error: updatePocketError } = await supabase
    .from("pockets")
    .update({ balance: currentPocketBalance - amount })
    .eq("id", pocketId)
    .eq("user_id", user.id);

  if (updatePocketError) {
    throw new Error(updatePocketError.message);
  }

  // Add to guardadito
  const { error: updateGuardaditoError } = await supabase
    .from("guardaditos")
    .update({ current: currentSavings + amount })
    .eq("id", guardaditoId)
    .eq("user_id", user.id);

  if (updateGuardaditoError) {
    throw new Error(updateGuardaditoError.message);
  }

  // Log transfer transaction: shows as an expense since it's going into a savings target (similar to wallet -> guardadito)
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    icon: guardadito.icon || "piggybank",
    title: `Ahorro: ${guardadito.name}`,
    subtitle: `From Pocket: ${pocket.name}`,
    amount,
    is_positive: false,
    status: "COMPLETED",
    pocket_id: pocketId,
    guardadito_id: guardaditoId,
  });

  if (txError) {
    throw new Error(txError.message);
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


