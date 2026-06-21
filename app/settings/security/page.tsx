import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import UnderConstruction from "@/components/UnderConstruction";

/** SecurityPage — Under construction placeholder for security settings. */
export default async function SecurityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  const userName = profile?.username || user.email?.split("@")[0] || "User";
  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar userName={userName} />
        <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-6 py-6 pb-20">
          <UnderConstruction title="Seguridad y Biometría" />
        </main>
      </div>
    </div>
  );
}
