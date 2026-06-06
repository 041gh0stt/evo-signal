"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  MessageSquare, Zap, TrendingUp, Link2,
  Wifi, WifiOff, ArrowUpRight, Clock, Star
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const ORIGIN_CONFIG: Record<string, { label: string; color: string }> = {
  meta_ads: { label: "Meta Ads", color: "#3b82f6" },
  google_ads: { label: "Google Ads", color: "#10b981" },
  organic: { label: "Orgânico", color: "#8b5cf6" },
  untracked: { label: "Não Rastreado", color: "#f59e0b" },
};

interface Props {
  workspace: {
    id: string;
    name: string;
    whatsappConnected: boolean;
    whatsappPhone: string | null;
  };
  stats: {
    totalConversations: number;
    trackedConversations: number;
    untrackedConversations: number;
    trackedRate: number;
    pixelFires: number;
    originBreakdown: { origin: string; _count: number }[];
  };
  recentConversations: {
    id: string;
    phone: string;
    name: string | null;
    origin: string;
    leadScore: number;
    lastMessageAt: Date;
    _count: { messages: number; pixelFires: number };
  }[];
}

export function DashboardClient({ workspace, stats, recentConversations }: Props) {
  const chartData = stats.originBreakdown.map((o) => ({
    name: ORIGIN_CONFIG[o.origin]?.label ?? o.origin,
    value: o._count,
    color: ORIGIN_CONFIG[o.origin]?.color ?? "#6b7280",
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">{workspace.name}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Últimos 7 dias</p>
        </div>
        <div className="flex items-center gap-2">
          {workspace.whatsappConnected ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1.5">
              <Wifi className="w-3 h-3" /> WhatsApp Conectado
            </Badge>
          ) : (
            <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 gap-1.5">
              <WifiOff className="w-3 h-3" /> WhatsApp Desconectado
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<MessageSquare className="w-4 h-4" />} label="Conversas Totais" value={stats.totalConversations} color="emerald" />
        <KPICard icon={<Link2 className="w-4 h-4" />} label="Rastreadas" value={stats.trackedConversations} sub={`${stats.trackedRate}% do total`} color="blue" />
        <KPICard icon={<Zap className="w-4 h-4" />} label="Eventos Disparados" value={stats.pixelFires} color="violet" />
        <KPICard icon={<TrendingUp className="w-4 h-4" />} label="Taxa de Rastreio" value={`${stats.trackedRate}%`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Origem das Conversas</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#f4f4f5" }} cursor={{ fill: "#27272a" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">Sem dados no período</div>
          )}
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Funil de Rastreio</h2>
          <div className="space-y-4">
            <FunnelStep label="Total de Conversas" count={stats.totalConversations} total={stats.totalConversations} color="zinc" />
            <FunnelStep label="Rastreadas" count={stats.trackedConversations} total={stats.totalConversations} color="emerald" />
            <FunnelStep label="Eventos Pixel" count={stats.pixelFires} total={stats.totalConversations} color="violet" />
          </div>
        </Card>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">Conversas Recentes</h2>
          <a href="/conversations" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            Ver todas <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        {recentConversations.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm">Nenhuma conversa ainda. Configure seu WhatsApp nas configurações.</div>
        ) : (
          <div className="space-y-1">
            {recentConversations.map((conv) => (
              <div key={conv.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-300 shrink-0">
                  {(conv.name ?? conv.phone).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200 truncate">{conv.name ?? conv.phone}</span>
                    <OriginBadge origin={conv.origin} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(conv.lastMessageAt, { locale: ptBR, addSuffix: true })}
                    </span>
                    <span>{conv._count.messages} msgs</span>
                    {conv._count.pixelFires > 0 && (
                      <span className="text-violet-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />{conv._count.pixelFires}
                      </span>
                    )}
                  </div>
                </div>
                <LeadScore score={conv.leadScore} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function KPICard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: "emerald" | "blue" | "violet" | "amber";
}) {
  const colorMap = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 p-4">
      <div className={`inline-flex p-2 rounded-lg border mb-3 ${colorMap[color]}`}>{icon}</div>
      <div className="text-2xl font-bold text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-zinc-600 mt-1">{sub}</div>}
    </Card>
  );
}

function FunnelStep({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorMap: Record<string, string> = { zinc: "bg-zinc-600", emerald: "bg-emerald-500", violet: "bg-violet-500" };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-medium">{count} <span className="text-zinc-600">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colorMap[color] ?? "bg-zinc-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function OriginBadge({ origin }: { origin: string }) {
  const config = ORIGIN_CONFIG[origin];
  if (!config) return null;
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${config.color}20`, color: config.color }}>
      {config.label}
    </span>
  );
}

function LeadScore({ score }: { score: number }) {
  const stars = Math.min(Math.floor(score / 20), 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < stars ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
      ))}
    </div>
  );
}
