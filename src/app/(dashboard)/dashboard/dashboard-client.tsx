"use client";

import { Card } from "@/components/ui/card";
import {
  MessageSquare, Zap, TrendingUp, Link2,
  Wifi, WifiOff, ArrowUpRight, Clock, ChevronDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";

const ORIGIN_CONFIG: Record<string, { label: string; color: string }> = {
  meta_ads:   { label: "Meta Ads",      color: "#3b82f6" },
  google_ads: { label: "Google Ads",    color: "#10b981" },
  organic:    { label: "Orgânico",      color: "#8b5cf6" },
  untracked:  { label: "Não Rastreado", color: "#f59e0b" },
};

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order: number;
  isSale: boolean;
  count: number;
}

const RANGE_OPTIONS = [
  { key: "1d",         label: "Hoje" },
  { key: "7d",         label: "Últimos 7 dias" },
  { key: "30d",        label: "Últimos 30 dias" },
  { key: "90d",        label: "Últimos 90 dias" },
  { key: "month",      label: "Este mês" },
  { key: "last_month", label: "Mês passado" },
  { key: "custom",     label: "Personalizado…" },
];

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
  rangeKey: string;
  rangeLabel: string;
  customFrom?: string;
  customTo?: string;
  recentConversations: {
    id: string;
    phone: string;
    name: string | null;
    origin: string;
    leadScore: number;
    lastMessageAt: Date;
    _count: { messages: number; pixelFires: number };
  }[];
  funnelStages: FunnelStage[];
}

export function DashboardClient({ workspace, stats, recentConversations, funnelStages, rangeKey, rangeLabel, customFrom = "", customTo = "" }: Props) {
  const router = useRouter();
  const [rangeOpen, setRangeOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange>({ from: customFrom, to: customTo });

  function selectRange(key: string) {
    if (key === "custom") {
      setRangeOpen(false);
      setShowCustom(true);
      return;
    }
    setRangeOpen(false);
    router.push(`/dashboard?range=${key}`);
  }

  function applyCustomRange(range: DateRange) {
    setCustomRange(range);
    setShowCustom(false);
    if (range.from) {
      router.push(`/dashboard?range=custom&from=${range.from}${range.to ? `&to=${range.to}` : ""}`);
    }
  }

  const chartData = stats.originBreakdown.map((o) => ({
    name: ORIGIN_CONFIG[o.origin]?.label ?? o.origin,
    value: o._count,
    color: ORIGIN_CONFIG[o.origin]?.color ?? "#6b7280",
  }));

  const maxFunnelCount = Math.max(...funnelStages.map((s) => s.count), 1);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-100">{workspace.name}</h1>
          {/* Date range picker */}
          <div className="relative mt-1">
            <button
              onClick={() => { setRangeOpen((v) => !v); setShowCustom(false); }}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <span>{rangeLabel}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${rangeOpen ? "rotate-180" : ""}`} />
            </button>

            {rangeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
                <div className="absolute left-0 top-6 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => selectRange(opt.key)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        opt.key === rangeKey
                          ? "bg-emerald-500/15 text-emerald-400 font-medium"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Custom date range picker — opens inline below trigger */}
            {showCustom && (
              <div className="absolute left-0 top-6 z-20">
                <DateRangePicker
                  value={customRange}
                  onChange={applyCustomRange}
                  placeholder="Selecionar período"
                  defaultOpen
                />
              </div>
            )}
          </div>
        </div>
        {workspace.whatsappConnected ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
            <Wifi className="w-3 h-3" />
            <span className="font-medium">WhatsApp Conectado</span>
            {workspace.whatsappPhone && (
              <span className="text-emerald-600 border-l border-emerald-500/30 pl-2 ml-1">{workspace.whatsappPhone}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1.5">
            <WifiOff className="w-3 h-3" />
            <span className="font-medium">WhatsApp Desconectado</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          label="Conversas Totais"
          value={stats.totalConversations}
          color="emerald"
        />
        <KPICard
          icon={<Link2 className="w-3.5 h-3.5" />}
          label="Rastreadas"
          value={stats.trackedConversations}
          sub={`${stats.trackedRate}% do total`}
          color="blue"
        />
        <KPICard
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Eventos Pixel"
          value={stats.pixelFires}
          color="violet"
        />
        <KPICard
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="Taxa de Rastreio"
          value={`${stats.trackedRate}%`}
          color="amber"
        />
      </div>

      {/* Middle row: Chart + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Origin chart — 3 cols */}
        <Card className="lg:col-span-3 bg-zinc-900/50 border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300">Origem das Conversas</h2>
            <div className="flex items-center gap-3">
              {Object.entries(ORIGIN_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-xs text-zinc-500">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={36} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#f4f4f5", fontSize: 12 }}
                  cursor={{ fill: "#27272a" }}
                />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} label={false}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center gap-2 text-zinc-600">
              <MessageSquare className="w-8 h-8 opacity-30" />
              <p className="text-sm">Sem dados no período</p>
            </div>
          )}
        </Card>

        {/* Funnel Jornada — 2 cols */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300">Jornada de Compra</h2>
            <Link href="/funnel" className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
              Ver <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {funnelStages.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center gap-2 text-zinc-600">
              <TrendingUp className="w-8 h-8 opacity-30" />
              <p className="text-sm text-center">Nenhuma etapa configurada</p>
              <Link href="/funnel" className="text-xs text-emerald-400 hover:underline">Configurar jornada →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {funnelStages.map((stage, i) => {
                const pct = maxFunnelCount > 0 ? Math.round((stage.count / maxFunnelCount) * 100) : 0;
                const widthPct = 100 - i * (30 / Math.max(funnelStages.length, 1));
                return (
                  <div key={stage.id} className="group" style={{ paddingLeft: `${(100 - widthPct) / 2}%`, paddingRight: `${(100 - widthPct) / 2}%` }}>
                    <div
                      className="relative rounded-lg px-3 py-2 flex items-center justify-between transition-all group-hover:brightness-110"
                      style={{ background: `${stage.color}18`, border: `1px solid ${stage.color}30` }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: stage.color }} />
                        <span className="text-xs text-zinc-300 truncate font-medium">{stage.name}</span>
                        {stage.isSale && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0" style={{ background: `${stage.color}30`, color: stage.color }}>
                            Venda
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-sm font-bold text-zinc-100">{stage.count}</span>
                        {i > 0 && (
                          <span className="text-[10px] text-zinc-600 ml-1">({pct}%)</span>
                        )}
                      </div>
                      {/* Progress bar inside */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-lg overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${pct}%`, background: stage.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent conversations */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">Conversas Recentes</h2>
          <Link href="/conversations" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            Ver todas <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {recentConversations.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm">
            Nenhuma conversa ainda. Configure seu WhatsApp nas configurações.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recentConversations.map((conv) => {
              const cfg = ORIGIN_CONFIG[conv.origin];
              return (
                <div key={conv.id} className="flex items-center gap-3 py-2.5 hover:bg-zinc-800/30 -mx-2 px-2 rounded-lg transition-colors">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
                    {(conv.name ?? conv.phone).charAt(0).toUpperCase()}
                  </div>

                  {/* Name + origin */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-200 truncate">
                        {conv.name ?? conv.phone}
                      </span>
                      {cfg && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                          style={{ background: `${cfg.color}20`, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-zinc-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(conv.lastMessageAt, { locale: ptBR, addSuffix: true })}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span>{conv._count.messages} msgs</span>
                      {conv._count.pixelFires > 0 && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span className="text-violet-400 flex items-center gap-0.5">
                            <Zap className="w-3 h-3" />{conv._count.pixelFires}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lead score dots */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const filled = i < Math.min(Math.floor(conv.leadScore / 20), 5);
                      return (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${filled ? "bg-amber-400" : "bg-zinc-800"}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
    emerald: { icon: "text-emerald-400 bg-emerald-500/10", value: "text-emerald-50" },
    blue:    { icon: "text-blue-400 bg-blue-500/10",       value: "text-blue-50" },
    violet:  { icon: "text-violet-400 bg-violet-500/10",   value: "text-violet-50" },
    amber:   { icon: "text-amber-400 bg-amber-500/10",     value: "text-amber-50" },
  };
  const c = colorMap[color];
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 p-4 flex flex-col gap-2">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.icon}`}>
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold ${c.value}`}>{value}</div>
        <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}
