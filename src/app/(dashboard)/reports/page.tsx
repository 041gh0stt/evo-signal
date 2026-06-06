export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TrendingUp, Zap, MessageSquare, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!member) redirect("/onboarding");

  const wid = member.workspaceId;
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total30, total7, tracked30, pixelFires30, topOrigins, topEvents] = await Promise.all([
    prisma.conversation.count({ where: { workspaceId: wid, createdAt: { gte: since30 } } }),
    prisma.conversation.count({ where: { workspaceId: wid, createdAt: { gte: since7 } } }),
    prisma.conversation.count({ where: { workspaceId: wid, createdAt: { gte: since30 }, NOT: { origin: "untracked" } } }),
    prisma.pixelFire.count({ where: { conversation: { workspaceId: wid }, firedAt: { gte: since30 }, success: true } }),
    prisma.conversation.groupBy({
      by: ["origin"],
      where: { workspaceId: wid, createdAt: { gte: since30 } },
      _count: true,
      orderBy: { _count: { origin: "desc" } },
    }),
    prisma.pixelFire.groupBy({
      by: ["eventName"],
      where: { conversation: { workspaceId: wid }, firedAt: { gte: since30 }, success: true },
      _count: true,
      orderBy: { _count: { eventName: "desc" } },
    }),
  ]);

  const ORIGIN_LABELS: Record<string, string> = {
    meta_ads: "Meta Ads",
    google_ads: "Google Ads",
    organic: "Orgânico",
    untracked: "Não Rastreado",
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Relatórios
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Últimos 30 dias</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Conversas (30d)", value: total30, icon: MessageSquare, color: "emerald" },
          { label: "Conversas (7d)", value: total7, icon: MessageSquare, color: "blue" },
          { label: "Rastreadas (30d)", value: tracked30, icon: Link2, color: "violet" },
          { label: "Eventos Pixel (30d)", value: pixelFires30, icon: Zap, color: "amber" },
        ].map(({ label, value, icon: Icon, color }) => {
          const colors: Record<string, string> = {
            emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
            violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
            amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          };
          return (
            <Card key={label} className="bg-zinc-900/50 border-zinc-800 p-4">
              <div className={`inline-flex p-2 rounded-lg border mb-3 ${colors[color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-zinc-100">{value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origem */}
        <Card className="bg-zinc-900/50 border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Conversas por Origem</h2>
          {topOrigins.length === 0 ? (
            <p className="text-zinc-600 text-sm">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {topOrigins.map((o) => {
                const pct = total30 > 0 ? Math.round((o._count / total30) * 100) : 0;
                return (
                  <div key={o.origin} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">{ORIGIN_LABELS[o.origin] ?? o.origin}</span>
                      <span className="text-zinc-300 font-medium">{o._count} <span className="text-zinc-600">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Eventos mais disparados */}
        <Card className="bg-zinc-900/50 border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Eventos Pixel Disparados</h2>
          {topEvents.length === 0 ? (
            <p className="text-zinc-600 text-sm">Nenhum evento disparado ainda</p>
          ) : (
            <div className="space-y-3">
              {topEvents.map((e) => {
                const max = topEvents[0]._count;
                const pct = max > 0 ? Math.round((e._count / max) * 100) : 0;
                return (
                  <div key={e.eventName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-violet-400" />
                        {e.eventName}
                      </span>
                      <span className="text-zinc-300 font-medium">{e._count}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Taxa de rastreio */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-2">Taxa de Rastreio (30d)</h2>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold text-zinc-100">
            {total30 > 0 ? Math.round((tracked30 / total30) * 100) : 0}%
          </span>
          <span className="text-sm text-zinc-500 pb-1">{tracked30} de {total30} conversas rastreadas</span>
        </div>
        <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${total30 > 0 ? (tracked30 / total30) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          Para aumentar a taxa, use Links Rastreáveis nos seus anúncios e materiais de marketing.
        </p>
      </Card>
    </div>
  );
}
