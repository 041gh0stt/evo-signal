"use client";

import { Card } from "@/components/ui/card";
import {
  TrendingUp, Zap, MessageSquare, Link2, DollarSign, Target,
  ChevronDown, CheckCircle2, XCircle, Download, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";

const ORIGIN_COLORS: Record<string, string> = {
  meta_ads: "#3b82f6",
  google_ads: "#10b981",
  organic: "#8b5cf6",
  untracked: "#f59e0b",
};

const RANGE_OPTIONS = [
  { key: "7d",         label: "Últimos 7 dias" },
  { key: "30d",        label: "Últimos 30 dias" },
  { key: "90d",        label: "Últimos 90 dias" },
  { key: "month",      label: "Este mês" },
  { key: "last_month", label: "Mês passado" },
  { key: "custom",     label: "Personalizado…" },
];

interface OriginStat {
  origin: string;
  label: string;
  leads: number;
  sales: number;
  conversionRate: number;
}

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order: number;
  isSale: boolean;
  pixelEventName: string | null;
  count: number;
}

interface PixelEvent {
  eventName: string;
  success: number;
  fail: number;
  total: number;
}

interface Props {
  rangeKey: string;
  rangeLabel: string;
  customFrom?: string;
  customTo?: string;
  kpis: {
    totalConversations: number;
    trackedConversations: number;
    trackedRate: number;
    salesCount: number;
    revenue: number;
  };
  dailySeries: { date: string; label: string; count: number }[];
  originStats: OriginStat[];
  funnelStages: FunnelStage[];
  pixelEvents: PixelEvent[];
}

const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function ReportsClient({
  rangeKey, rangeLabel, customFrom = "", customTo = "",
  kpis, dailySeries, originStats, funnelStages, pixelEvents,
}: Props) {
  const router = useRouter();
  const [rangeOpen, setRangeOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange>({ from: customFrom, to: customTo });
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  async function exportToPdf() {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      // Usamos o fork "html2canvas-pro" porque o Tailwind v4 gera cores em oklch(),
      // e o html2canvas original não consegue interpretar essa função de cor
      // (falha silenciosamente, sem baixar nada).
      const [html2canvasMod, jsPDFMod] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      type Html2CanvasFn = (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
      const html2canvas = ((html2canvasMod as unknown as { default?: Html2CanvasFn }).default ??
        (html2canvasMod as unknown as Html2CanvasFn));
      const jsPDF = ((jsPDFMod as unknown as { jsPDF?: typeof import("jspdf").jsPDF }).jsPDF ??
        (jsPDFMod as unknown as { default: typeof import("jspdf").jsPDF }).default);
      const node = exportRef.current;
      const canvas = await html2canvas(node, {
        backgroundColor: "#09090b",
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 595; // A4 width in pt
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [pdfWidth, pdfHeight] });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`relatorio-evosignal-${rangeKey}.pdf`);
    } catch (err) {
      console.error("Falha ao exportar relatório em PDF:", err);
      alert("Não foi possível gerar o PDF do relatório. Tente novamente em instantes.");
    } finally {
      setExporting(false);
    }
  }

  function selectRange(key: string) {
    if (key === "custom") {
      setRangeOpen(false);
      setShowCustom(true);
      return;
    }
    setRangeOpen(false);
    router.push(`/reports?range=${key}`);
  }

  function applyCustomRange(range: DateRange) {
    setCustomRange(range);
    setShowCustom(false);
    if (range.from) {
      router.push(`/reports?range=custom&from=${range.from}${range.to ? `&to=${range.to}` : ""}`);
    }
  }

  const maxFunnelCount = Math.max(...funnelStages.map((s) => s.count), 1);
  const maxEventTotal = Math.max(...pixelEvents.map((e) => e.total), 1);

  const kpiCards = [
    { label: "Conversas no período", value: kpis.totalConversations.toLocaleString("pt-BR"), icon: MessageSquare, color: "emerald" },
    { label: "Taxa de Rastreio", value: `${kpis.trackedRate}%`, icon: Link2, color: "violet" },
    { label: "Vendas", value: kpis.salesCount.toLocaleString("pt-BR"), icon: Target, color: "blue" },
    { label: "Receita Gerada", value: currency(kpis.revenue), icon: DollarSign, color: "amber" },
  ] as const;

  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Relatórios
          </h1>
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

        <button
          onClick={exportToPdf}
          disabled={exporting}
          className="flex items-center gap-2 text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-100 transition-colors rounded-lg px-3.5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {exporting ? "Gerando PDF…" : "Exportar PDF"}
        </button>
      </div>

      <div ref={exportRef} className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-zinc-900/50 border-zinc-800 p-4">
            <div className={`inline-flex p-1.5 rounded-md border mb-2 ${colorClasses[color]}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold text-zinc-100">{value}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Conversas ao longo do tempo */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Conversas ao Longo do Tempo</h2>
        {dailySeries.length === 0 ? (
          <p className="text-zinc-600 text-sm">Sem dados no período selecionado</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailySeries} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#27272a" }}
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#e4e4e7" }}
                itemStyle={{ color: "#34d399" }}
                formatter={(value) => [value, "Conversas"]}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Conversão por origem */}
        <Card className="bg-zinc-900/50 border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Conversão por Origem</h2>
          {originStats.length === 0 ? (
            <p className="text-zinc-600 text-sm">Sem dados</p>
          ) : (
            <div className="space-y-4">
              {originStats.map((o) => (
                <div key={o.origin} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ORIGIN_COLORS[o.origin] ?? "#6b7280" }} />
                      {o.label}
                    </span>
                    <span className="text-zinc-300">
                      <span className="font-medium">{o.leads}</span> leads
                      {" · "}
                      <span className="font-medium text-emerald-400">{o.sales}</span> vendas
                      {" · "}
                      <span className="text-zinc-500">{o.conversionRate}% conv.</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${o.leads > 0 ? (o.sales / o.leads) * 100 : 0}%`, backgroundColor: ORIGIN_COLORS[o.origin] ?? "#6b7280" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-zinc-600 mt-4">
            Mostra quantos leads cada origem trouxe e quantos viraram vendas no período.
          </p>
        </Card>

        {/* Funil da jornada */}
        <Card className="bg-zinc-900/50 border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Jornada de Compra</h2>
          {funnelStages.length === 0 ? (
            <p className="text-zinc-600 text-sm">Nenhuma etapa configurada ainda</p>
          ) : (
            <div className="space-y-3">
              {funnelStages
                .sort((a, b) => a.order - b.order)
                .map((s) => {
                  const pct = Math.round((s.count / maxFunnelCount) * 100);
                  return (
                    <div key={s.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                          {s.isSale && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              venda
                            </span>
                          )}
                        </span>
                        <span className="text-zinc-300 font-medium">{s.count}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          <p className="text-xs text-zinc-600 mt-4">
            Quantidade de conversas (criadas no período) que estão atualmente em cada etapa.
          </p>
        </Card>
      </div>

      {/* Eventos de pixel */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Eventos Pixel Disparados</h2>
        {pixelEvents.length === 0 ? (
          <p className="text-zinc-600 text-sm">Nenhum evento disparado no período</p>
        ) : (
          <div className="space-y-3">
            {pixelEvents.map((e) => {
              const pct = Math.round((e.total / maxEventTotal) * 100);
              return (
                <div key={e.eventName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-violet-400" />
                      {e.eventName}
                    </span>
                    <span className="flex items-center gap-3 text-zinc-300">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> {e.success}
                      </span>
                      {e.fail > 0 && (
                        <span className="flex items-center gap-1 text-rose-400">
                          <XCircle className="w-3 h-3" /> {e.fail}
                        </span>
                      )}
                      <span className="font-medium">{e.total}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${e.total > 0 ? (e.success / e.total) * pct : 0}%` }} />
                    <div className="h-full bg-rose-500" style={{ width: `${e.total > 0 ? (e.fail / e.total) * pct : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Taxa de rastreio detalhada */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-2">Taxa de Rastreio</h2>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold text-zinc-100">{kpis.trackedRate}%</span>
          <span className="text-sm text-zinc-500 pb-1">
            {kpis.trackedConversations} de {kpis.totalConversations} conversas rastreadas
          </span>
        </div>
        <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${kpis.trackedRate}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          Para aumentar a taxa, use Links Rastreáveis nos seus anúncios e materiais de marketing — assim o sistema
          consegue identificar a origem de cada novo lead automaticamente.
        </p>
      </Card>
      </div>
    </div>
  );
}
