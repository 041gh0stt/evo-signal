export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ConversationsClient } from "./conversations-client";

export default async function ConversationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");

  const [conversations, funnelStages] = await Promise.all([
    prisma.conversation.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { lastMessageAt: "desc" },
      take: 200,
      include: {
        funnelStage: true,
        trackableLink: { select: { id: true, name: true, slug: true } },
        _count: { select: { messages: true, pixelFires: true } },
      },
    }),
    prisma.funnelStage.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { order: "asc" },
    }),
  ]);

  const stats = {
    total: conversations.length,
    metaAds: conversations.filter((c) => c.origin === "meta_ads").length,
    googleAds: conversations.filter((c) => c.origin === "google_ads").length,
    organic: conversations.filter((c) => c.origin === "organic").length,
    untracked: conversations.filter((c) => c.origin === "untracked").length,
  };

  return (
    <ConversationsClient
      conversations={conversations}
      funnelStages={funnelStages}
      stats={stats}
    />
  );
}
