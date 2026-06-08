export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspace";
import { DashboardClient } from "./dashboard-client";

const RANGES: Record<string, () => { since: Date; label: string }> = {
  "1d":  () => ({ since: new Date(Date.now() - 1  * 24 * 60 * 60 * 1000), label: "Hoje" }),
  "7d":  () => ({ since: new Date(Date.now() - 7  * 24 * 60 * 60 * 1000), label: "Últimos 7 dias" }),
  "30d": () => ({ since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), label: "Últimos 30 dias" }),
  "90d": () => ({ since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), label: "Últimos 90 dias" }),
  "month": () => {
    const n = new Date();
    return { since: new Date(n.getFullYear(), n.getMonth(), 1), label: "Este mês" };
  },
  "last_month": () => {
    const n = new Date();
    return { since: new Date(n.getFullYear(), n.getMonth() - 1, 1), label: "Mês passado" };
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");

  const { range: rawRange, from: rawFrom, to: rawTo } = await searchParams;

  let since: Date;
  let until: Date | undefined;
  let rangeKey: string;
  let rangeLabel: string;

  if (rawRange === "custom" && rawFrom) {
    since = new Date(rawFrom + "T00:00:00");
    until = rawTo ? new Date(rawTo + "T23:59:59") : undefined;
    rangeKey = "custom";
    const fmt = (s: string) => s.split("-").reverse().join("/");
    rangeLabel = rawTo && rawTo !== rawFrom
      ? `${fmt(rawFrom)} → ${fmt(rawTo)}`
      : fmt(rawFrom);
  } else {
    const key = rawRange && RANGES[rawRange] ? rawRange : "7d";
    rangeKey = key;
    const r = RANGES[key]();
    since = r.since;
    rangeLabel = r.label;
    until = key === "last_month"
      ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : undefined;
  }

  const wid = workspace.id;
  const dateFilter = { gte: since, ...(until ? { lt: until } : {}) };

  const [totalConversations, trackedConversations, pixelFires, originBreakdown, recentConversations, funnelStages, triggerStagesCount, saleStagesCount, trackableLinksCount] =
    await Promise.all([
      prisma.conversation.count({ where: { workspaceId: wid, createdAt: dateFilter } }),
      prisma.conversation.count({
        where: { workspaceId: wid, createdAt: dateFilter, NOT: { origin: "untracked" } },
      }),
      prisma.pixelFire.count({
        where: { conversation: { workspaceId: wid }, firedAt: dateFilter, success: true },
      }),
      prisma.conversation.groupBy({
        by: ["origin"],
        where: { workspaceId: wid, createdAt: dateFilter },
        _count: true,
      }),
      prisma.conversation.findMany({
        where: { workspaceId: wid },
        orderBy: { lastMessageAt: "desc" },
        take: 8,
        include: { _count: { select: { messages: true, pixelFires: true } } },
      }),
      prisma.funnelStage.findMany({
        where: { workspaceId: wid },
        orderBy: { order: "asc" },
        include: { _count: { select: { conversations: true } } },
      }),
      prisma.funnelStage.count({ where: { workspaceId: wid, triggerKeyword: { not: null } } }),
      prisma.funnelStage.count({ where: { workspaceId: wid, isSale: true, pixelEventName: { not: null } } }),
      prisma.trackableLink.count({ where: { workspaceId: wid } }),
    ]);

  const onboarding = {
    whatsappConnected: workspace.whatsappConnected,
    hasTriggerKeyword: triggerStagesCount > 0,
    hasSaleStage: saleStagesCount > 0,
    hasTrackableLink: trackableLinksCount > 0,
  };

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
      onboarding={onboarding}
      recentConversations={recentConversations}
      rangeKey={rangeKey}
      rangeLabel={rangeLabel}
      customFrom={rawRange === "custom" ? (rawFrom ?? "") : ""}
      customTo={rawRange === "custom" ? (rawTo ?? "") : ""}
      funnelStages={funnelStages.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        order: s.order,
        isSale: s.isSale,
        count: s._count.conversations,
      }))}
    />
  );
}
