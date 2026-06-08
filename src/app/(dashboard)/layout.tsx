import { DashboardShell } from "@/components/layout/dashboard-shell";
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
    <DashboardShell activeWorkspace={activeWithRole} allWorkspaces={allWorkspaces}>
      {children}
    </DashboardShell>
  );
}
