import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import GuardaditosDetailView from "@/components/GuardaditosDetailView";
import type { CustomCategory } from "@/components/DashboardView";

type GuardaditoPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Route controller for individual Guardaditos detailed states.
 * Retrieves authenticated context, goal specifications, and historical transaction changes.
 * All independent queries run in parallel via Promise.all.
 */
export default async function GuardaditoPage({ params }: GuardaditoPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Guardadito existence check must happen before streaming starts to allow redirect
  const { data: dbGuardadito, error: gError } = await supabase
    .from("guardaditos")
    .select("id, name, icon, current, target, theme_index, notes, link")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (gError || !dbGuardadito) {
    redirect("/");
  }

  const guardadito = {
    id: dbGuardadito.id,
    name: dbGuardadito.name,
    icon: dbGuardadito.icon,
    current: Number(dbGuardadito.current),
    target: dbGuardadito.target !== null ? Number(dbGuardadito.target) : null,
    notes: dbGuardadito.notes || "",
    link: dbGuardadito.link || "",
    themeIndex: dbGuardadito.theme_index,
  };

  // ── Parallel data fetching for remaining independent queries ───────────────
  const [
    { data: dbTransactions },
    { data: dbGuardaditos },
    { data: portfolio },
    { data: dbCustomCategories },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, amount, is_positive, created_at, title")
      .eq("guardadito_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("guardaditos")
      .select("id, name, icon, current, target, theme_index")
      .eq("user_id", user.id)
      .order("theme_index", { ascending: true }),
    supabase
      .from("portfolios")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("custom_categories")
      .select("id, label, icon")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);
  // ──────────────────────────────────────────────────────────────────────────

  const transactions = (dbTransactions || []).map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    is_positive: row.is_positive,
    created_at: row.created_at,
    title: row.title,
  }));

  const guardaditos = (dbGuardaditos || []).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    current: Number(row.current),
    target: row.target !== null ? Number(row.target) : null,
    formattedAmount: `$${Number(row.current).toLocaleString("en-US")}`,
    themeIndex: row.theme_index,
  }));

  const walletBalance = portfolio ? Number(portfolio.balance) : 0;

  const customCategories: CustomCategory[] = (dbCustomCategories || []).map((row) => ({
    id: row.id,
    label: row.label,
    icon: row.icon,
  }));

  return (
    <GuardaditosDetailView
      guardadito={guardadito}
      transactions={transactions}
      guardaditos={guardaditos}
      customCategories={customCategories}
      walletBalance={walletBalance}
    />
  );
}

