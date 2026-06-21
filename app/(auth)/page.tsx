import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import DashboardView, { type CustomCategory } from "@/components/DashboardView";
import type { GuardaditoData } from "@/components/GuardaditosSection";
import type { TransactionData } from "@/components/TransactionItem";

/**
 * DashboardPage is the server-side entry point for the main dashboard view.
 * All Supabase queries run in parallel via Promise.all to minimize total wait time.
 *
 * @returns The rendered DashboardView with hydrated database states.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Parallel data fetching: all queries fire at the same time ──────────────
  const [
    { data: profile },
    { data: portfolio },
    { data: dbGuardaditos },
    { data: dbPockets },
    { data: dbTransactions },
    { data: dbCustomCategories },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("portfolios")
      .select("balance, change_percent, is_positive")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("guardaditos")
      .select("id, name, icon, current, target, theme_index")
      .eq("user_id", user.id)
      .order("theme_index", { ascending: true }),
    supabase
      .from("pockets")
      .select("id, name, subtitle, balance, design_preset, custom_design")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("transactions")
      .select("id, icon, title, subtitle, amount, is_positive, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("custom_categories")
      .select("id, label, icon")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);
  // ─────────────────────────────────────────────────────────────────────────

  const userName = profile?.username || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url ?? null;

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
  }));

  const pockets = (dbPockets || []).map((row) => ({
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    balance: Number(row.balance),
    design_preset: row.design_preset as any,
    custom_design: row.custom_design as any,
  }));

  const guardaditosSum = guardaditos.reduce((sum, g) => sum + g.current, 0);
  const pocketsSum = pockets.reduce((sum, p) => sum + p.balance, 0);
  const totalBalanceVal = (portfolio ? Number(portfolio.balance) : 0) + guardaditosSum + pocketsSum;

  const portfolioFormatted = {
    balance: `$${totalBalanceVal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    changePercent: portfolio
      ? `${portfolio.is_positive ? "+" : "-"}${Number(
          portfolio.change_percent
        ).toFixed(1)}%`
      : "+0.0%",
    isPositive: portfolio ? portfolio.is_positive : true,
    rawWalletBalance: portfolio ? Number(portfolio.balance) : 0,
  };

  const transactions: TransactionData[] = (dbTransactions || []).map((row) => ({
    id: row.id,
    icon: row.icon,
    title: row.title,
    subtitle: row.subtitle,
    amount: `${row.is_positive ? "+" : "-"}$${Number(row.amount).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`,
    isPositive: row.is_positive,
    status: row.status as "PENDING" | "COMPLETED" | "FAILED",
  }));

  const customCategories: CustomCategory[] = (dbCustomCategories || []).map((row) => ({
    id: row.id,
    label: row.label,
    icon: row.icon,
  }));

  return (
    <DashboardView
      portfolio={portfolioFormatted}
      guardaditos={guardaditos}
      pockets={pockets}
      transactions={transactions}
      customCategories={customCategories}
    />
  );
}

