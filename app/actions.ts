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

  // Validation: cannot spend more than we have in the specific context
  if (!isPositive) {
    if (pocketId) {
      const { data: pocket } = await supabase
        .from("pockets")
        .select("balance")
        .eq("id", pocketId)
        .eq("user_id", user.id)
        .single();
      if (!pocket || Number(pocket.balance) < amount) {
        throw new Error("Fondos insuficientes en la tarjeta");
      }
    } else if (guardaditoId) {
      const { data: guardadito } = await supabase
        .from("guardaditos")
        .select("current")
        .eq("id", guardaditoId)
        .eq("user_id", user.id)
        .single();
      if (!guardadito || Number(guardadito.current) < amount) {
        throw new Error("Fondos insuficientes en el guardadito");
      }
    } else {
      const { data: portfolio } = await supabase
        .from("portfolios")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      const currentBalance = portfolio ? Number(portfolio.balance) : 0;
      if (currentBalance < amount) {
        throw new Error("Fondos insuficientes en tu billetera");
      }
    }
  }

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    icon: category,
    title,
    subtitle,
    amount,
    is_positive: isPositive,
    status: "COMPLETED",
    guardadito_id: guardaditoId || null,
    pocket_id: pocketId || null,
    receipt_url: receiptUrl,
    created_at: txDate,
  });

  if (txError) {
    throw new Error(txError.message);
  }

  if (pocketId) {
    const { data: pocket, error: fetchPocketError } = await supabase
      .from("pockets")
      .select("balance")
      .eq("id", pocketId)
      .single();

    if (!fetchPocketError && pocket) {
      const currentPocketBalance = parseFloat(pocket.balance.toString());
      const newPocketBalance = isPositive ? currentPocketBalance + amount : Math.max(0, currentPocketBalance - amount);
      await supabase
        .from("pockets")
        .update({ balance: newPocketBalance })
        .eq("id", pocketId);
    }
  } else if (guardaditoId) {
    const { data: guardadito, error: fetchGuardaditoError } = await supabase
      .from("guardaditos")
      .select("current")
      .eq("id", guardaditoId)
      .single();

    if (!fetchGuardaditoError && guardadito) {
      const currentSavings = parseFloat(guardadito.current.toString());
      // If isPositive is true (Income): increase guardadito (money added to savings goal)
      // If isPositive is false (Expense): decrease guardadito (money spent from savings goal)
      const newSavings = isPositive ? currentSavings + amount : Math.max(0, currentSavings - amount);
      await supabase
        .from("guardaditos")
        .update({ current: newSavings })
        .eq("id", guardaditoId);
    }
  } else {
    let { data: portfolio, error: fetchPortError } = await supabase
      .from("portfolios")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchPortError) {
      throw new Error(fetchPortError.message);
    }

    let currentBalance = 0;
    let hasPortfolio = false;
    if (portfolio) {
      currentBalance = parseFloat(portfolio.balance.toString());
      hasPortfolio = true;
    }

    const newBalance = isPositive ? currentBalance + amount : currentBalance - amount;

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

  const { data: guardadito, error: fetchGuardaditoError } = await supabase
    .from("guardaditos")
    .select("current")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchGuardaditoError || !guardadito) {
    throw new Error("Savings goal not found");
  }

  let { data: portfolio, error: fetchPortError } = await supabase
    .from("portfolios")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchPortError) {
    throw new Error(fetchPortError.message);
  }

  const currentSavings = parseFloat(guardadito.current.toString());
  let currentBalance = 0;
  let hasPortfolio = false;
  if (portfolio) {
    currentBalance = parseFloat(portfolio.balance.toString());
    hasPortfolio = true;
  }

  // Validations: prevent negative balances
  if (isDeposit && currentBalance < amount) {
    throw new Error("Fondos insuficientes en tu billetera para realizar el depósito");
  }
  if (!isDeposit && currentSavings < amount) {
    throw new Error("No puedes retirar más dinero del que tiene el guardadito");
  }

  const newSavings = isDeposit ? currentSavings + amount : Math.max(0, currentSavings - amount);
  const newBalance = isDeposit ? currentBalance - amount : currentBalance + amount;

  const { error: updateGuardaditoError } = await supabase
    .from("guardaditos")
    .update({ current: newSavings })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateGuardaditoError) {
    throw new Error(updateGuardaditoError.message);
  }

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

  const title = isDeposit ? `Ahorro: ${name}` : `Retiro: ${name}`;
  const subtitle = isDeposit ? "Goal Deposit • Today" : "Goal Withdrawal • Today";

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    icon: icon,
    title: title,
    subtitle: subtitle,
    amount: amount,
    is_positive: !isDeposit,
    status: "COMPLETED",
    guardadito_id: id,
  });

  if (txError) {
    throw new Error(txError.message);
  }

  revalidatePath("/");
  revalidatePath(`/guardaditos/${id}`);
}
