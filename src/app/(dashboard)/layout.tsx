import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { auth } from "@/lib/auth";
import { getActiveWorkspace, getUserWorkspaces } from "@/lib/workspace";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [activeWorkspace, allWorkspaces] = await Promise.all([
    getActiveWorkspace(),
    getUserWorkspaces(),
  ]);

  if (!activeWorkspace) redirect("/onboarding");

  const activeWithRole = {
    ...activeWorkspace,
    role: allWorkspaces.find((w) => w.id === activeWorkspace.id)?.role ?? "member",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeWorkspace={activeWithRole} allWorkspaces={allWorkspaces} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
