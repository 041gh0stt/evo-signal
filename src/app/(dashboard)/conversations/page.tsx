export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ConversationsClient } from "./conversations-client";

const PAGE_SIZE = 50;

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; origin?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");

  const { page: pageParam, origin: originParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const origin = originParam && originParam !== "all" ? originParam : undefined;

  const where = {
    workspaceId: workspace.id,
    ...(origin ? { origin } : {}),
  };

  const [conversations, totalCount, funnelStages, allCounts] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        funnelStage: true,
        trackableLink: { select: { id: true, name: true, slug: true } },
        _count: { select: { messages: true, pixelFires: true } },
      },
    }),
    prisma.conversation.count({ where }),
    prisma.funnelStage.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { order: "asc" },
    }),
    // Contagens totais por origem (independente do filtro de origem ativo)
    prisma.conversation.groupBy({
      by: ["origin"],
      where: { workspaceId: workspace.id },
      _count: true,
    }),
  ]);

  const countByOrigin = Object.fromEntries(allCounts.map((r) => [r.origin, r._count]));

  const stats = {
    total: allCounts.reduce((s, r) => s + r._count, 0),
    metaAds:    countByOrigin["meta_ads"]   ?? 0,
    googleAds:  countByOrigin["google_ads"] ?? 0,
    untracked:  countByOrigin["untracked"]  ?? 0,
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <ConversationsClient
      conversations={conversations}
      funnelStages={funnelStages}
      stats={stats}
      pagination={{ page, totalPages, totalCount, pageSize: PAGE_SIZE }}
      activeOrigin={originParam ?? "all"}
    />
  );
}
