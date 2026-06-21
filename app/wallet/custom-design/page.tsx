import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import BackBreadcrumb from "@/components/BackBreadcrumb";
import PocketDesignEditor from "@/components/PocketDesignEditor";
import { getPocketDesigns } from "@/app/actions_pockets";

export default async function CustomDesignPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  const userName = profile?.username || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url ?? null;

  // Fetch saved designs
  let designs: any[] = [];
  try {
    designs = await getPocketDesigns();
  } catch (e) {
    console.error("Failed to load pocket designs:", e);
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[var(--color-bg)]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar 
          userName={userName} 
          avatarUrl={avatarUrl} 
          breadcrumbOptions={{
            parentHref: "/wallet",
            parentLabel: "Wallet / Tarjetas",
            last: "Personalizar"
          }}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 pb-[calc(72px+32px)] lg:pb-12 w-full max-w-5xl mx-auto flex flex-col gap-6">
          <PocketDesignEditor initialDesigns={designs} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
