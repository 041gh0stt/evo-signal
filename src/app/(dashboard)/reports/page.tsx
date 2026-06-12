export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspace";
import { ReportsClient } from "./reports-client";

const RANGES: Record<string, () => { since: Date; label: string }> = {
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

export default async function ReportsPage({
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
    const key = rawRange && RANGES[rawRange] ? rawRange : "30d";
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

  const [
    conversations,
    funnelStagesRaw,
    pixelFiresGrouped,
    pixelFiresFailedGrouped,
  ] = await Promise.all([
    prisma.conversation.findMany({
      where: { workspaceId: wid, createdAt: dateFilter },
      select: { id: true, createdAt: true, origin: true, funnelStageId: true },
    }),
    prisma.funnelStage.findMany({
      where: { workspaceId: wid },
      orderBy: { order: "asc" },
      select: { id: true, name: true, color: true, order: true, isSale: true, purchaseValue: true, pixelEventName: true },
    }),
    prisma.pixelFire.groupBy({
      by: ["eventName"],
      where: { conversation: { workspaceId: wid }, firedAt: dateFilter, success: true },
      _count: true,
    }),
    prisma.pixelFire.groupBy({
      by: ["eventName"],
      where: { conversation: { workspaceId: wid }, firedAt: dateFilter, success: false },
      _count: true,
    }),
  ]);

  const ORIGIN_LABELS: Record<string, string> = {
    meta_ads: "Meta Ads",
    google_ads: "Google Ads",
    untracked: "Não Rastreado",
  };

  const stageById = new Map(funnelStagesRaw.map((s) => [s.id, s]));
  const saleStageIds = new Set(funnelStagesRaw.filter((s) => s.isSale).map((s) => s.id));

  // KPIs principais
  const totalConversations = conversations.length;
  const trackedConversations = conversations.filter((c) => c.origin !== "untracked").length;
  const trackedRate = totalConversations > 0 ? Math.round((trackedConversations / totalConversations) * 100) : 0;

  let salesCount = 0;
  let revenue = 0;
  for (const c of conversations) {
    if (c.funnelStageId && saleStageIds.has(c.funnelStageId)) {
      salesCount++;
      revenue += stageById.get(c.funnelStageId)?.purchaseValue ?? 0;
    }
  }

  // Série diária de conversas (agrupamento em JS)
  const dayMap = new Map<string, number>();
  for (const c of conversations) {
    const key = c.createdAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const dailySeries = Array.from(dayMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => {
      const [, m, d] = date.split("-");
      return { date, label: `${d}/${m}`, count };
    });

  // Conversão por origem (leads x vendas dentro do período)
  const originMap = new Map<string, { leads: number; sales: number }>();
  for (const c of conversations) {
    const entry = originMap.get(c.origin) ?? { leads: 0, sales: 0 };
    entry.leads++;
    if (c.funnelStageId && saleStageIds.has(c.funnelStageId)) entry.sales++;
    originMap.set(c.origin, entry);
  }
  const originStats = Array.from(originMap.entries())
    .map(([origin, { leads, sales }]) => ({
      origin,
      label: ORIGIN_LABELS[origin] ?? origin,
      leads,
      sales,
      conversionRate: leads > 0 ? Math.round((sales / leads) * 100) : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  // Funil da jornada — quantas conversas (criadas no período) estão em cada etapa atualmente
  const stageCountMap = new Map<string, number>();
  for (const c of conversations) {
    if (!c.funnelStageId) continue;
    stageCountMap.set(c.funnelStageId, (stageCountMap.get(c.funnelStageId) ?? 0) + 1);
  }
  const funnelStages = funnelStagesRaw.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    order: s.order,
    isSale: s.isSale,
    pixelEventName: s.pixelEventName,
    count: stageCountMap.get(s.id) ?? 0,
  }));

  // Eventos de pixel — sucesso x falha
  const failedMap = new Map(pixelFiresFailedGrouped.map((f) => [f.eventName, f._count]));
  const allEventNames = new Set([
    ...pixelFiresGrouped.map((f) => f.eventName),
    ...pixelFiresFailedGrouped.map((f) => f.eventName),
  ]);
  const pixelEvents = Array.from(allEventNames)
    .map((eventName) => {
      const success = pixelFiresGrouped.find((f) => f.eventName === eventName)?._count ?? 0;
      const fail = failedMap.get(eventName) ?? 0;
      return { eventName, success, fail, total: success + fail };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <ReportsClient
      rangeKey={rangeKey}
      rangeLabel={rangeLabel}
      customFrom={rawRange === "custom" ? (rawFrom ?? "") : ""}
      customTo={rawRange === "custom" ? (rawTo ?? "") : ""}
      kpis={{
        totalConversations,
        trackedConversations,
        trackedRate,
        salesCount,
        revenue,
      }}
      dailySeries={dailySeries}
      originStats={originStats}
      funnelStages={funnelStages}
      pixelEvents={pixelEvents}
    />
  );
}
