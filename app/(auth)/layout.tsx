import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { BreadcrumbProvider } from "@/lib/BreadcrumbContext";
import TopBarWrapper from "@/components/TopBarWrapper";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <BreadcrumbProvider>
      <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[var(--color-bg)]">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen">
          <TopBarWrapper userName={userName} avatarUrl={avatarUrl} />

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        <BottomNav />
      </div>
    </BreadcrumbProvider>
  );
}
