import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import TransactionFormView from "@/components/TransactionFormView";
import type { GuardaditoData } from "@/components/GuardaditosSection";
import type { CustomCategory } from "@/components/DashboardView";
import { createTransaction } from "@/app/actions";

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all necessary data to hydrate the transaction form page
  const [
    { data: profile },
    { data: portfolio },
    { data: dbGuardaditos },
    { data: dbPockets },
    { data: dbCustomCategories },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("portfolios")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("guardaditos")
      .select("id, name, icon, current, target, theme_index, cover_url, cover_position, cover_opacity")
      .eq("user_id", user.id)
      .order("theme_index", { ascending: true }),
    supabase
      .from("pockets")
      .select("id, name, subtitle, balance, design_preset, custom_design")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("custom_categories")
      .select("id, label, icon")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const guardaditos: GuardaditoData[] = (dbGuardaditos || []).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    current: Number(row.current),
    target: row.target !== null ? Number(row.target) : null,
    formattedAmount: `$${Number(row.current).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`,
    themeIndex: row.theme_index,
    coverUrl: row.cover_url || null,
    coverPosition: row.cover_position || "center",
    coverOpacity: row.cover_opacity !== null && row.cover_opacity !== undefined ? Number(row.cover_opacity) : 0.35,
  }));

  const pockets = (dbPockets || []).map((row) => ({
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    balance: Number(row.balance),
    design_preset: row.design_preset as any,
    custom_design: row.custom_design as any,
  }));

  const customCategories: CustomCategory[] = (dbCustomCategories || []).map((row) => ({
    id: row.id,
    label: row.label,
    icon: row.icon,
  }));

  const walletBalance = portfolio ? Number(portfolio.balance) : 0;

  const userName = profile?.username || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <TransactionFormView
      userName={userName}
      avatarUrl={avatarUrl}
      guardaditos={guardaditos}
      pockets={pockets}
      customCategories={customCategories}
      onSubmitAction={createTransaction}
      walletBalance={walletBalance}
    />
  );
}
