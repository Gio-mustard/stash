import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import WalletView from "@/components/WalletView";

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Parallel data fetching ─────────────────────────────────────────────────
  const [
    { data: profile },
    { data: portfolio },
    { data: guardaditos },
    { data: dbPockets },
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
      .select("current")
      .eq("user_id", user.id),
    supabase
      .from("pockets")
      .select("id, name, subtitle, balance, design_preset, custom_design")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
  ]);
  // ──────────────────────────────────────────────────────────────────────────

  const userName = profile?.username || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || null;
  const walletBalance = portfolio ? Number(portfolio.balance) : 0;
  const guardaditosTotal = (guardaditos || []).reduce((sum, g) => sum + Number(g.current), 0);

  const pockets = (dbPockets || []).map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    balance: Number(p.balance),
    design_preset: p.design_preset as any,
    custom_design: p.custom_design as any,
  }));

  const pocketsTotal = pockets.reduce((sum, p) => sum + p.balance, 0);

  return (
    <WalletView
      userName={userName}
      avatarUrl={avatarUrl}
      pockets={pockets}
      walletBalance={walletBalance}
      guardaditosTotal={guardaditosTotal}
      pocketsTotal={pocketsTotal}
    />
  );
}

