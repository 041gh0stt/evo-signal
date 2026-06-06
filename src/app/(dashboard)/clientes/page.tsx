import { getUserWorkspaces, getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ClientesClient } from "./clientes-client";

export default async function ClientesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [workspaces, activeWorkspace] = await Promise.all([
    getUserWorkspaces(),
    getActiveWorkspace(),
  ]);

  // Enrich with conversation count
  const enriched = await Promise.all(
    workspaces.map(async (ws) => {
      const [convCount, pixelCount] = await Promise.all([
        prisma.conversation.count({ where: { workspaceId: ws.id } }),
        prisma.pixelFire.count({
          where: { conversation: { workspaceId: ws.id }, success: true },
        }),
      ]);
      return { ...ws, convCount, pixelCount };
    })
  );

  return (
    <ClientesClient
      workspaces={enriched}
      activeWorkspaceId={activeWorkspace?.id ?? ""}
    />
  );
}
