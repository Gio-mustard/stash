import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import ProfileView from "@/components/ProfileView";

/**
 * ProfilePage gathers user account data (username, email, avatar, balance, guardaditos count)
 * and renders the full profile dashboard. All queries run in parallel.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Parallel data fetching ─────────────────────────────────────────────────
  const [
    { data: profile },
    { data: portfolio },
    { data: dbGuardaditos },
    { data: dbPockets },
    { count: guardaditosCount },
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
      .eq("user_id", user.id),
    supabase
      .from("guardaditos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);
  // ──────────────────────────────────────────────────────────────────────────

  const username = profile?.username || user.email?.split("@")[0] || "User";
  const email = user.email || "";
  const avatarUrl = profile?.avatar_url ?? null;

  const pockets = (dbPockets || []).map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    balance: Number(p.balance),
    design_preset: p.design_preset as any,
    custom_design: p.custom_design as any,
  }));

  const guardaditosSum = (dbGuardaditos || []).reduce((sum, row) => sum + Number(row.current), 0);
  const pocketsSum = pockets.reduce((sum, p) => sum + p.balance, 0);
  const totalBalanceVal = (portfolio ? Number(portfolio.balance) : 0) + guardaditosSum + pocketsSum;

  const balance = `$${totalBalanceVal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[var(--color-bg)]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar userName={username} avatarUrl={avatarUrl} />

        <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-6 py-6 pb-[calc(72px+32px)] lg:pb-12 flex flex-col gap-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-on-surface)]">
              Mi Perfil
            </h1>
            <p className="text-xs text-[var(--color-on-dim)] mt-1">
              Tu información personal y configuración de cuenta
            </p>
          </div>

          <ProfileView
            initialUsername={username}
            email={email}
            avatarUrl={avatarUrl}
            balance={balance}
            guardaditosCount={guardaditosCount ?? 0}
            pockets={pockets}
          />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

