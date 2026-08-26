"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

/**
 * Server action to create a new transaction and update the user's portfolio balance atomically.
 * Supports optional receipt file upload (Supabase Storage), custom date, and guardadito linking.
 *
 * @param formData - Form data: amount, note, category, type, date?, guardadito_id?, receipt_file?.
 */
export async function createTransaction(formData: FormData) {
  const amountStr = formData.get("amount") as string;
  const note = (formData.get("note") as string | null)?.trim() || "";
  const category = formData.get("category") as string;
  const type = formData.get("type") as string;
  const guardaditoId = formData.get("guardadito_id") as string | null;
  const pocketId = formData.get("pocket_id") as string | null;
  const dateStr = formData.get("date") as string | null;
  const receiptFile = formData.get("receipt_file") as File | null;

  const amount = Math.abs(parseFloat(amountStr));
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid transaction amount");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User session not found");
  }

  const isPositive = type === "INCOME";
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const title = note || categoryLabel;
  const txDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
  const subtitle = `${categoryLabel} • ${new Date(txDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`;

  let receiptUrl: string | null = null;

  if (receiptFile && receiptFile.size > 0) {
    const fileExt = receiptFile.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const fileBuffer = Buffer.from(await receiptFile.arrayBuffer());

    const { data: uploadData } = await supabase.storage
      .from("receipts")
      .upload(filePath, fileBuffer, { contentType: receiptFile.type, upsert: false });

    if (uploadData) {
      const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(uploadData.path);
      receiptUrl = publicUrl;
    }
  }

  const { error: rpcError } = await supabase.rpc("create_transaction_atomic", {
    p_user_id: user.id,
    p_amount: amount,
    p_is_positive: isPositive,
    p_icon: category,
    p_title: title,
    p_subtitle: subtitle,
    p_pocket_id: pocketId || null,
    p_guardadito_id: guardaditoId || null,
    p_receipt_url: receiptUrl,
    p_created_at: txDate,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  revalidatePath("/");
  if (guardaditoId) {
    revalidatePath(`/guardaditos/${guardaditoId}`);
  }
  if (pocketId) {
    revalidatePath(`/wallet/${pocketId}`);
    revalidatePath("/wallet");
  }
}

/**
 * Server action to update notes and external link on a savings goal.
 *
 * @param id - The savings goal unique identifier.
 * @param notes - The text notes.
 * @param link - The external URL.
 */
export async function updateGuardaditoDetails(id: string, notes: string, link: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error } = await supabase
    .from("guardaditos")
    .update({ notes, link })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath(`/guardaditos/${id}`);
}

/**
 * Server action to directly deposit or withdraw from a guardadito.
 * Automatically inserts a transaction log entry and syncs portfolio balance.
 *
 * @param id - The savings goal unique identifier.
 * @param name - Name of the savings goal (for transaction title).
 * @param icon - Icon key of the savings goal.
 * @param amount - Decimal transaction amount.
 * @param isDeposit - True for deposit (adding to savings), False for withdrawal (reducing savings).
 */
export async function quickDepositOrWithdraw(
  id: string,
  name: string,
  icon: string,
  amount: number,
  isDeposit: boolean
) {
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  const { error: rpcError } = await supabase.rpc("quick_deposit_withdraw_atomic", {
    p_user_id: user.id,
    p_guardadito_id: id,
    p_amount: amount,
    p_is_deposit: isDeposit,
    p_name: name,
    p_icon: icon,
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  revalidatePath("/");
  revalidatePath(`/guardaditos/${id}`);
}
