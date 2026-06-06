export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspace";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const wid = workspace.id;

  const [totalConversations, trackedConversations, pixelFires, originBreakdown, recentConversations] =
    await Promise.all([
      prisma.conversation.count({ where: { workspaceId: wid, createdAt: { gte: since } } }),
      prisma.conversation.count({
        where: { workspaceId: wid, createdAt: { gte: since }, NOT: { origin: "untracked" } },
      }),
      prisma.pixelFire.count({
        where: { conversation: { workspaceId: wid }, firedAt: { gte: since }, success: true },
      }),
      prisma.conversation.groupBy({
        by: ["origin"],
        where: { workspaceId: wid, createdAt: { gte: since } },
        _count: true,
      }),
      prisma.conversation.findMany({
        where: { workspaceId: wid },
        orderBy: { lastMessageAt: "desc" },
        take: 10,
        include: { _count: { select: { messages: true, pixelFires: true } } },
      }),
    ]);

  const stats = {
    totalConversations,
    trackedConversations,
    untrackedConversations: totalConversations - trackedConversations,
    trackedRate: totalConversations > 0 ? Math.round((trackedConversations / totalConversations) * 100) : 0,
    pixelFires,
    originBreakdown,
  };

  return (
    <DashboardClient
      workspace={workspace}
      stats={stats}
      recentConversations={recentConversations}
    />
  );
}
