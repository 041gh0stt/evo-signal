export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle, XCircle } from "lucide-react";

export default async function PixelLogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");

  const fires = await prisma.pixelFire.findMany({
    where: { conversation: { workspaceId: workspace.id } },
    orderBy: { firedAt: "desc" },
    take: 200,
    include: {
      conversation: { select: { phone: true, name: true } },
      eventConfig: { select: { name: true } },
    },
  });

  const totalSuccess = fires.filter((f) => f.success).length;
  const totalFail = fires.filter((f) => !f.success).length;

  const EVENT_COLORS: Record<string, string> = {
    Lead: "#3b82f6", Purchase: "#10b981", Schedule: "#8b5cf6",
    Contact: "#f59e0b", InitiateCheckout: "#ec4899", AddToCart: "#06b6d4",
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          Registro de Disparos de Pixel
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Histórico completo de eventos enviados ao Meta Pixel</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-zinc-100">{fires.length}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Total de disparos</div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-emerald-400">{totalSuccess}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Com sucesso
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-red-400">{totalFail}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Com falha
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <span>Lead</span>
          <span>Evento</span>
          <span>Gatilho</span>
          <span>Quando</span>
          <span>Status</span>
        </div>

        {fires.length === 0 ? (
          <div className="p-10 text-center">
            <Zap className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum disparo registrado ainda.</p>
            <p className="text-zinc-600 text-xs mt-1">
              Configure eventos de pixel e eles aparecerão aqui quando disparados.
            </p>
          </div>
        ) : (
          fires.map((fire) => {
            const color = EVENT_COLORS[fire.eventName] ?? "#6b7280";
            return (
              <div
                key={fire.id}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_80px] gap-4 px-4 py-3.5 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors items-center"
              >
                {/* Lead */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {fire.conversation.name ?? fire.conversation.phone}
                  </p>
                  {fire.conversation.name && (
                    <p className="text-xs text-zinc-600 truncate">{fire.conversation.phone}</p>
                  )}
                </div>

                {/* Event */}
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ background: `${color}20`, color }}
                  >
                    <Zap className="w-3 h-3" />
                    {fire.eventName}
                  </span>
                </div>

                {/* Trigger config */}
                <div className="text-sm text-zinc-400 truncate">
                  {fire.eventConfig?.name ?? <span className="text-zinc-600">Etapa do funil</span>}
                </div>

                {/* When */}
                <div className="text-xs text-zinc-500">
                  {formatDistanceToNow(fire.firedAt, { locale: ptBR, addSuffix: true })}
                </div>

                {/* Status */}
                <div>
                  {fire.success ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-xs">
                      <CheckCircle className="w-3 h-3" /> OK
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1 text-xs" title={fire.errorMessage ?? ""}>
                      <XCircle className="w-3 h-3" /> Falha
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
