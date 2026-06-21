import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PocketDetailView from "@/components/PocketDetailView";
import type { CustomCategory } from "@/components/DashboardView";

type PocketPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PocketPage({ params }: PocketPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Pocket existence check must happen before streaming starts to allow redirect
  const { data: dbPocket, error: pError } = await supabase
    .from("pockets")
    .select("id, name, subtitle, balance, design_preset, custom_design")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (pError || !dbPocket) {
    redirect("/wallet");
  }

  const pocket = {
    id: dbPocket.id,
    name: dbPocket.name,
    subtitle: dbPocket.subtitle,
    balance: Number(dbPocket.balance),
    design_preset: dbPocket.design_preset as any,
    custom_design: dbPocket.custom_design as any,
  };

  // ── Parallel data fetching for remaining independent queries ───────────────
  const [
    { data: dbTransactions },
    { data: profile },
    { data: dbGuardaditos },
    { data: dbCustomCategories },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, amount, is_positive, created_at, title, icon")
      .eq("pocket_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("guardaditos")
      .select("id, name, icon, current, target, theme_index")
      .eq("user_id", user.id)
      .order("theme_index", { ascending: true }),
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
    icon: row.icon || undefined,
  }));

  const userName = profile?.username || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url ?? null;

  const guardaditos = (dbGuardaditos || []).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    current: Number(row.current),
    target: row.target !== null ? Number(row.target) : null,
    formattedAmount: `$${Number(row.current).toLocaleString("es-MX")}`,
    themeIndex: row.theme_index,
  }));

  const customCategories: CustomCategory[] = (dbCustomCategories || []).map((row) => ({
    id: row.id,
    label: row.label,
    icon: row.icon,
  }));

  return (
    <PocketDetailView
      userName={userName}
      avatarUrl={avatarUrl}
      pocket={pocket}
      transactions={transactions}
      guardaditos={guardaditos}
      customCategories={customCategories}
    />
  );
}

