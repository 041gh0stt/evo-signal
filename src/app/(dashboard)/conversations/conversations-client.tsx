"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MessageSquare, Search, X, Zap, ChevronDown,
  Clock, Star, Eye, GitBranch, Info, RefreshCw,
  SlidersHorizontal, Filter, ArrowUpDown, ArrowUp, ArrowDown, Link2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";

const ORIGIN_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  meta_ads:    { label: "Meta Ads",      color: "#3b82f6", icon: "M" },
  google_ads:  { label: "Google Ads",    color: "#10b981", icon: "G" },
  organic:     { label: "Orgânico",      color: "#8b5cf6", icon: "O" },
  untracked:   { label: "Não Rastreada", color: "#f59e0b", icon: "?" },
};

interface FunnelStage { id: string; name: string; color: string; }
interface TrackableLink { id: string; name: string; slug: string; }
interface Conversation {
  id: string; phone: string; name: string | null;
  origin: string; leadScore: number;
  funnelStageId: string | null;
  funnelStage: FunnelStage | null;
  trackableLink: TrackableLink | null;
  utmSource: string | null; utmMedium: string | null; utmCampaign: string | null;
  adSourceId: string | null; adTitle: string | null; adBody: string | null;
  adSourceUrl: string | null; adThumbnailUrl: string | null;
  firstMessageAt: Date; lastMessageAt: Date;
  _count: { messages: number; pixelFires: number };
}
interface Message {
  id: string; direction: string; content: string | null;
  type: string; timestamp: Date;
}
interface ConvDetail extends Conversation {
  messages: Message[];
  pixelFires: { id: string; eventName: string; success: boolean; firedAt: Date }[];
}

interface AdvancedFilters {
  funnelStageId: string;
  firstMsgRange: DateRange;
  lastMsgRange: DateRange;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  trackableLinkId: string;
}

const emptyAdvanced: AdvancedFilters = {
  funnelStageId: "",
  firstMsgRange: { from: "", to: "" },
  lastMsgRange: { from: "", to: "" },
  utmSource: "", utmMedium: "", utmCampaign: "",
  trackableLinkId: "",
};

interface Props {
  conversations: Conversation[];
  funnelStages: FunnelStage[];
  stats: { total: number; metaAds: number; googleAds: number; organic: number; untracked: number };
}

export function ConversationsClient({ conversations, funnelStages, stats }: Props) {
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState("all");
  const [originDropOpen, setOriginDropOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedFilters>(emptyAdvanced);
  const [localConvs, setLocalConvs] = useState(conversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [changingStage, setChangingStage] = useState(false);
  const [stageMenuFor, setStageMenuFor] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(conversations.length === 0);
  const [sortKey, setSortKey] = useState<"name" | "origin" | "funnelStage" | "firstMessageAt" | "lastMessageAt">("lastMessageAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // Unique trackable links from conversations
  const trackableLinks: TrackableLink[] = [];
  localConvs.forEach((c) => {
    if (c.trackableLink && !trackableLinks.find((l) => l.id === c.trackableLink!.id)) {
      trackableLinks.push(c.trackableLink);
    }
  });

  const advancedActiveCount = [
    advanced.funnelStageId,
    advanced.trackableLinkId,
    advanced.utmSource, advanced.utmMedium, advanced.utmCampaign,
    advanced.firstMsgRange.from, advanced.lastMsgRange.from,
  ].filter(Boolean).length;

  const setAdv = (patch: Partial<AdvancedFilters>) => setAdvanced((a) => ({ ...a, ...patch }));

  const refreshList = useCallback(() => {
    return fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLocalConvs(data);
          setSyncing(false);
        }
        return Array.isArray(data) ? data : [];
      });
  }, []);

  useEffect(() => {
    if (!syncing) return;
    let attempts = 0;
    const maxAttempts = 20;
    const poll = setInterval(async () => {
      attempts++;
      const data = await refreshList();
      if (data.length > 0 || attempts >= maxAttempts) {
        clearInterval(poll);
        setSyncing(false);
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [syncing, refreshList]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setLoadingDetail(true);
    fetch(`/api/conversations/${selectedId}`)
      .then((r) => r.json())
      .then((d) => { setDetail(d); setLoadingDetail(false); });
  }, [selectedId]);

  useEffect(() => {
    let lastConvSnapshot = JSON.stringify(localConvs.map(c => ({ id: c.id, lastMsg: c.lastMessageAt })));
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/conversations");
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const newSnapshot = JSON.stringify(data.map((c: Conversation) => ({ id: c.id, lastMsg: c.lastMessageAt })));
        if (newSnapshot === lastConvSnapshot) return;
        lastConvSnapshot = newSnapshot;
        setLocalConvs(data);
        setSyncing(false);
        if (selectedIdRef.current) {
          const updated = data.find((c: Conversation) => c.id === selectedIdRef.current);
          const current = localConvs.find(c => c.id === selectedIdRef.current);
          if (updated && current && String(updated.lastMessageAt) !== String(current.lastMessageAt)) {
            fetch(`/api/conversations/${selectedIdRef.current}`).then(r => r.json()).then(d => setDetail(d));
          }
        }
      } catch { /* ignora erro de rede */ }
    }, 8000);
    return () => clearInterval(poll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  const filtered = localConvs.filter((c) => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
    if (originFilter !== "all" && c.origin !== originFilter) return false;
    if (advanced.funnelStageId && c.funnelStageId !== advanced.funnelStageId) return false;
    if (advanced.trackableLinkId && c.trackableLink?.id !== advanced.trackableLinkId) return false;
    if (advanced.utmSource && !c.utmSource?.toLowerCase().includes(advanced.utmSource.toLowerCase())) return false;
    if (advanced.utmMedium && !c.utmMedium?.toLowerCase().includes(advanced.utmMedium.toLowerCase())) return false;
    if (advanced.utmCampaign && !c.utmCampaign?.toLowerCase().includes(advanced.utmCampaign.toLowerCase())) return false;
    if (advanced.firstMsgRange.from && new Date(c.firstMessageAt) < new Date(advanced.firstMsgRange.from)) return false;
    if (advanced.firstMsgRange.to && new Date(c.firstMessageAt) > new Date(advanced.firstMsgRange.to + "T23:59:59")) return false;
    if (advanced.lastMsgRange.from && new Date(c.lastMessageAt) < new Date(advanced.lastMsgRange.from)) return false;
    if (advanced.lastMsgRange.to && new Date(c.lastMessageAt) > new Date(advanced.lastMsgRange.to + "T23:59:59")) return false;
    return true;
  });

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...filtered].sort((a, b) => {
    let va: string | number = "", vb: string | number = "";
    if (sortKey === "name") { va = (a.name ?? a.phone).toLowerCase(); vb = (b.name ?? b.phone).toLowerCase(); }
    else if (sortKey === "origin") { va = a.origin; vb = b.origin; }
    else if (sortKey === "funnelStage") { va = a.funnelStage?.name ?? ""; vb = b.funnelStage?.name ?? ""; }
    else if (sortKey === "firstMessageAt") { va = new Date(a.firstMessageAt).getTime(); vb = new Date(b.firstMessageAt).getTime(); }
    else if (sortKey === "lastMessageAt") { va = new Date(a.lastMessageAt).getTime(); vb = new Date(b.lastMessageAt).getTime(); }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  async function handleChangeStage(convId: string, stageId: string | null) {
    setChangingStage(true);
    const res = await fetch(`/api/funnel/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnelStageId: stageId }),
    });
    setChangingStage(false);
    if (res.ok) {
      const stage = funnelStages.find((s) => s.id === stageId) ?? null;
      setLocalConvs((c) => c.map((x) => x.id === convId ? { ...x, funnelStageId: stageId, funnelStage: stage } : x));
      if (detail?.id === convId) setDetail((d) => d ? { ...d, funnelStageId: stageId, funnelStage: stage } : d);
      setStageMenuFor(null);
      toast.success(stage ? `Movido para "${stage.name}"` : "Removido do funil");
    }
  }

  const initials = (conv: Conversation) => (conv.name ?? conv.phone).charAt(0).toUpperCase();


  const originLabel = originFilter === "all" ? "Todas as Origens" : (ORIGIN_CONFIG[originFilter]?.label ?? originFilter);

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`flex flex-col flex-1 overflow-hidden transition-all ${selectedId ? "mr-0" : ""}`}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Conversas
            </h1>
          </div>

          {syncing && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Sincronizando conversas do WhatsApp... As mensagens aparecerão em instantes.</span>
              <button onClick={() => setSyncing(false)} className="ml-auto text-zinc-500 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Stats bar */}
          <div className="flex items-center gap-6 text-sm">
            {[
              { key: "all",        label: "Total",         value: stats.total,      color: "text-zinc-300" },
              { key: "meta_ads",   label: "Meta Ads",      value: stats.metaAds,    color: "text-blue-400" },
              { key: "google_ads", label: "Google Ads",    value: stats.googleAds,  color: "text-emerald-400" },
              { key: "organic",    label: "Orgânico",      value: stats.organic,    color: "text-violet-400" },
              { key: "untracked",  label: "Não Rastreada", value: stats.untracked,  color: "text-amber-400" },
            ].map(({ key, label, value, color }) => (
              <button key={key} onClick={() => setOriginFilter(key)}
                className={`flex items-center gap-1.5 transition-all ${originFilter === key ? "opacity-100" : "opacity-50 hover:opacity-75"}`}>
                <span className={`text-xl font-bold ${color}`}>{value}</span>
                <span className="text-xs text-zinc-500">{label}</span>
              </button>
            ))}
          </div>

          {/* Search + filtros */}
          <div className="flex gap-2 flex-wrap">
            {/* Busca */}
            <div className="relative flex-1 min-w-48 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Telefone ou nome..."
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 pl-9" />
            </div>

            {/* Dropdown origem */}
            <div className="relative">
              <button
                onClick={() => setOriginDropOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                  originFilter !== "all"
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <Filter className="w-4 h-4" />
                {originLabel}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </button>
              {originDropOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOriginDropOpen(false)} />
                  <div className="absolute left-0 top-10 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1 min-w-44">
                    {[
                      { key: "all", label: "Todas as Origens", color: "#71717a" },
                      { key: "meta_ads",   label: "Meta Ads",      color: "#3b82f6" },
                      { key: "google_ads", label: "Google Ads",    color: "#10b981" },
                      { key: "organic",    label: "Orgânico",      color: "#8b5cf6" },
                      { key: "untracked",  label: "Não Rastreada", color: "#f59e0b" },
                    ].map(({ key, label, color }) => (
                      <button key={key}
                        onClick={() => { setOriginFilter(key); setOriginDropOpen(false); }}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                          originFilter === key ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        {label}
                        {originFilter === key && <span className="ml-auto text-emerald-400 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Filtros avançados */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                advancedActiveCount > 0
                  ? "bg-violet-600/10 border-violet-500/30 text-violet-400"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {advancedActiveCount > 0 && (
                <span className="bg-violet-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {advancedActiveCount}
                </span>
              )}
            </button>

            {/* Clear filters */}
            {(originFilter !== "all" || advancedActiveCount > 0 || search) && (
              <button
                onClick={() => { setOriginFilter("all"); setAdvanced(emptyAdvanced); setSearch(""); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Limpar filtros
              </button>
            )}
          </div>

          {/* Painel de filtros avançados */}
          {showAdvanced && (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-violet-400" />
                  Filtros Avançados
                </p>
                <button onClick={() => setShowAdvanced(false)} className="text-zinc-600 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Etapa da jornada */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500 font-medium">Etapa da Jornada</label>
                  <select
                    value={advanced.funnelStageId}
                    onChange={(e) => setAdv({ funnelStageId: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500 [color-scheme:dark]"
                  >
                    <option value="" style={{ backgroundColor: "#27272a", color: "#e4e4e7" }}>Todas as etapas</option>
                    {funnelStages.map((s) => (
                      <option key={s.id} value={s.id} style={{ backgroundColor: "#27272a", color: "#e4e4e7" }}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Link rastreável */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500 font-medium">Link Rastreável</label>
                  <select
                    value={advanced.trackableLinkId}
                    onChange={(e) => setAdv({ trackableLinkId: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500 [color-scheme:dark]"
                  >
                    <option value="" style={{ backgroundColor: "#27272a", color: "#e4e4e7" }}>Todos os links</option>
                    {trackableLinks.map((l) => (
                      <option key={l.id} value={l.id} style={{ backgroundColor: "#27272a", color: "#e4e4e7" }}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {/* UTM Source */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500 font-medium">UTM Source</label>
                  <Input
                    value={advanced.utmSource}
                    onChange={(e) => setAdv({ utmSource: e.target.value })}
                    placeholder="facebook, google..."
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 text-sm"
                  />
                </div>

                {/* UTM Medium */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500 font-medium">UTM Medium</label>
                  <Input
                    value={advanced.utmMedium}
                    onChange={(e) => setAdv({ utmMedium: e.target.value })}
                    placeholder="cpc, organic..."
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 text-sm"
                  />
                </div>

                {/* UTM Campaign */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500 font-medium">UTM Campaign</label>
                  <Input
                    value={advanced.utmCampaign}
                    onChange={(e) => setAdv({ utmCampaign: e.target.value })}
                    placeholder="nome-da-campanha"
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 text-sm"
                  />
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-zinc-800">
                <DateRangePicker
                  label="Período da primeira mensagem"
                  value={advanced.firstMsgRange}
                  onChange={(r) => setAdv({ firstMsgRange: r })}
                  placeholder="Selecionar período"
                />
                <DateRangePicker
                  label="Período da última mensagem"
                  value={advanced.lastMsgRange}
                  onChange={(r) => setAdv({ lastMsgRange: r })}
                  placeholder="Selecionar período"
                />
              </div>

              {advancedActiveCount > 0 && (
                <div className="flex justify-end">
                  <button onClick={() => setAdvanced(emptyAdvanced)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                    <X className="w-3 h-3" /> Limpar filtros avançados
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                  <span>Contato</span>
                  <SortIcon active={sortKey === "name"} dir={sortDir} />
                </button>
                <div className="relative group">
                  <Info className="w-3.5 h-3.5 text-zinc-700 hover:text-zinc-400 cursor-help transition-colors" />
                  <div className="absolute left-0 top-5 z-30 hidden group-hover:block w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3.5 text-left">
                    <p className="text-xs font-semibold text-zinc-200 mb-2 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Lead Score
                    </p>
                    <p className="text-xs text-zinc-400 mb-2.5 leading-relaxed">
                      Pontuação automática de 0 a 100 que indica o quão qualificado é o lead com base nas suas interações.
                    </p>
                    <div className="space-y-1.5 border-t border-zinc-800 pt-2.5">
                      {[
                        { stars: 1, label: "Só fez contato" },
                        { stars: 2, label: "Algum engajamento" },
                        { stars: 3, label: "Evento de pixel disparado" },
                        { stars: 4, label: "Múltiplos eventos" },
                        { stars: 5, label: "Lead muito qualificado" },
                      ].map((item) => (
                        <div key={item.stars} className="flex items-center gap-2">
                          <div className="flex gap-0.5 shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-2.5 h-2.5 ${i < item.stars ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-zinc-400">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-zinc-800 mt-2.5 pt-2.5 space-y-1">
                      <p className="text-[11px] text-zinc-600 font-medium">O que aumenta o score:</p>
                      <p className="text-[11px] text-zinc-600">+10 pts por evento de pixel disparado</p>
                      <p className="text-[11px] text-zinc-600">+15 pts ao avançar etapa da jornada</p>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => toggleSort("origin")} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                <span>Origem</span><SortIcon active={sortKey === "origin"} dir={sortDir} />
              </button>
              <button onClick={() => toggleSort("funnelStage")} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                <span>Etapa da Jornada</span><SortIcon active={sortKey === "funnelStage"} dir={sortDir} />
              </button>
              <button onClick={() => toggleSort("firstMessageAt")} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                <span>Primeira Msg</span><SortIcon active={sortKey === "firstMessageAt"} dir={sortDir} />
              </button>
              <button onClick={() => toggleSort("lastMessageAt")} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                <span>Última Msg</span><SortIcon active={sortKey === "lastMessageAt"} dir={sortDir} />
              </button>
              <span></span>
            </div>

            {sorted.length === 0 ? (
              <div className="p-10 text-center text-zinc-600 text-sm">
                {search || originFilter !== "all" || advancedActiveCount > 0
                  ? "Nenhuma conversa encontrada com esses filtros"
                  : "Nenhuma conversa ainda"}
              </div>
            ) : (
              sorted.map((conv) => {
                const origin = ORIGIN_CONFIG[conv.origin];
                const isSelected = conv.id === selectedId;
                const stars = Math.min(Math.floor(conv.leadScore / 20), 5);

                return (
                  <div key={conv.id}
                    className={`grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3.5 border-b border-zinc-800/50 last:border-0 transition-colors ${
                      isSelected ? "bg-emerald-500/5 border-l-2 border-l-emerald-500" : "hover:bg-zinc-800/30"
                    }`}
                  >
                    {/* Contato */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300 shrink-0">
                        {initials(conv)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">{conv.name ?? conv.phone}</p>
                        {conv.name && <p className="text-xs text-zinc-600 truncate">{conv.phone}</p>}
                        <div className="flex items-center gap-0.5 mt-0.5 relative group/score">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-2.5 h-2.5 ${i < stars ? "text-amber-400 fill-amber-400" : "text-zinc-800"}`} />
                          ))}
                          {conv._count.pixelFires > 0 && (
                            <span className="ml-1.5 text-xs text-violet-400 flex items-center gap-0.5">
                              <Zap className="w-3 h-3" />{conv._count.pixelFires}
                            </span>
                          )}
                          <div className="absolute left-0 bottom-5 z-30 hidden group-hover/score:block w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2.5 pointer-events-none">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-zinc-300">Lead Score</span>
                              <span className="text-xs font-bold text-amber-400">{conv.leadScore}/100</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${conv.leadScore}%` }} />
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-relaxed">
                              {conv.leadScore === 0 && "Só fez contato, sem interações qualificadas."}
                              {conv.leadScore > 0 && conv.leadScore <= 30 && "Baixo engajamento. Acompanhe."}
                              {conv.leadScore > 30 && conv.leadScore <= 60 && "Engajamento moderado. Bom potencial."}
                              {conv.leadScore > 60 && conv.leadScore <= 80 && "Lead quente! Priorize o atendimento."}
                              {conv.leadScore > 80 && "Lead muito qualificado. Alta chance de conversão! 🔥"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Origem */}
                    <div className="flex items-center">
                      {origin ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: origin.color }}>
                          <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center" style={{ background: `${origin.color}20` }}>
                            {origin.icon}
                          </span>
                          {origin.label}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </div>

                    {/* Etapa */}
                    <div className="flex items-center relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setStageMenuFor(stageMenuFor === conv.id ? null : conv.id); }}
                        className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
                      >
                        {conv.funnelStage ? (
                          <>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: conv.funnelStage.color }} />
                            <span style={{ color: conv.funnelStage.color }}>{conv.funnelStage.name}</span>
                          </>
                        ) : (
                          <span className="text-zinc-600">— sem etapa</span>
                        )}
                        <ChevronDown className="w-3 h-3 text-zinc-600" />
                      </button>

                      {stageMenuFor === conv.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setStageMenuFor(null)} />
                          <div className="absolute left-0 top-7 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1 min-w-44">
                            <button onClick={() => handleChangeStage(conv.id, null)}
                              className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-zinc-400 hover:bg-zinc-800 rounded-lg">
                              <span className="w-2 h-2 rounded-full bg-zinc-600" /> Sem etapa
                            </button>
                            {funnelStages.map((s) => (
                              <button key={s.id} onClick={() => handleChangeStage(conv.id, s.id)}
                                className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                                {s.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Primeira msg */}
                    <div className="flex items-center text-xs text-zinc-500">
                      <Clock className="w-3 h-3 mr-1 shrink-0" />
                      {format(new Date(conv.firstMessageAt), "dd/MM/yy HH:mm")}
                    </div>

                    {/* Última msg */}
                    <div className="flex items-center text-xs text-zinc-400">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), { locale: ptBR, addSuffix: true })}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => setSelectedId(conv.id === selectedId ? null : conv.id)}
                        title="Visualizar conversa"
                        className={`p-1.5 rounded-lg transition-all ${
                          isSelected ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
                        }`}>
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {sorted.length > 0 && (
            <p className="text-xs text-zinc-600 text-center mt-3">
              {sorted.length} conversa{sorted.length !== 1 ? "s" : ""} exibida{sorted.length !== 1 ? "s" : ""}
              {sorted.length !== localConvs.length && ` (de ${localConvs.length} no total)`}
            </p>
          )}
        </div>
      </div>

      {/* Conversation detail panel */}
      {selectedId && (
        <div className="w-96 shrink-0 border-l border-zinc-800 bg-zinc-900/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300">
                {detail ? initials(detail) : "?"}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{detail?.name ?? detail?.phone ?? "..."}</p>
                {detail?.name && <p className="text-xs text-zinc-500">{detail.phone}</p>}
              </div>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {detail?.adSourceId && (
            <div className="px-4 py-3 border-b border-zinc-800 shrink-0 bg-blue-500/5">
              <p className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 mb-2">
                <Link2 className="w-3.5 h-3.5" /> Veio de um anúncio (Meta Ads)
              </p>
              <div className="flex gap-2.5">
                {detail.adThumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detail.adThumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-zinc-800" />
                )}
                <div className="min-w-0">
                  {detail.adTitle && <p className="text-sm font-medium text-zinc-200 truncate">{detail.adTitle}</p>}
                  {detail.adBody && <p className="text-xs text-zinc-500 line-clamp-2">{detail.adBody}</p>}
                  {detail.adSourceUrl && (
                    <a href={detail.adSourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                      Ver anúncio
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">Carregando mensagens...</div>
            ) : detail?.messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">Nenhuma mensagem registrada</div>
            ) : (
              detail?.messages.map((msg) => {
                const isOutbound = msg.direction === "outbound";
                return (
                  <div key={msg.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      isOutbound ? "bg-emerald-600 text-white rounded-br-sm" : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                    }`}>
                      {msg.content === "[mídia]" || !msg.content ? (
                        <span className="italic text-xs opacity-70">📎 Mídia</span>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                      <p className={`text-[10px] mt-1 ${isOutbound ? "text-emerald-200" : "text-zinc-500"}`}>
                        {format(new Date(msg.timestamp), "dd/MM 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {detail && detail.pixelFires.length > 0 && (
            <div className="px-4 py-2 border-t border-zinc-800 shrink-0">
              <p className="text-xs font-semibold text-zinc-500 mb-1.5">Eventos Pixel disparados</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.pixelFires.map((pf) => (
                  <Badge key={pf.id} className={`text-xs gap-1 ${pf.success ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    <Zap className="w-3 h-3" /> {pf.eventName}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-zinc-800 shrink-0">
            <div className="relative">
              <Button
                onClick={() => setStageMenuFor(stageMenuFor === `panel-${selectedId}` ? null : `panel-${selectedId}`)}
                disabled={changingStage}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
              >
                <GitBranch className="w-4 h-4" />
                {detail?.funnelStage ? `Etapa: ${detail.funnelStage.name}` : "Alterar Etapa da Jornada"}
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
              {stageMenuFor === `panel-${selectedId}` && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStageMenuFor(null)} />
                  <div className="absolute bottom-12 left-0 right-0 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1">
                    <button onClick={() => handleChangeStage(selectedId, null)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 rounded-lg">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> Sem etapa
                    </button>
                    {funnelStages.map((s) => (
                      <button key={s.id} onClick={() => handleChangeStage(selectedId, s.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        {s.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  return dir === "asc"
    ? <ArrowUp className="w-3 h-3 text-emerald-400" />
    : <ArrowDown className="w-3 h-3 text-emerald-400" />;
}
