"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MessageSquare, Search, X, Zap, ChevronDown,
  Clock, Star, Eye, GitBranch, Info, RefreshCw,
  SlidersHorizontal, Filter, ArrowUpDown, ArrowUp, ArrowDown, Link2, Megaphone,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";

interface MetaCampaign { id: string; name: string; status: string; }

const ORIGIN_CONFIG: Record<string, { label: string; color: string; icon: string; img?: string }> = {
  meta_ads:    { label: "Meta Ads",      color: "#3b82f6", icon: "M", img: "/icon-meta-24.png" },
  google_ads:  { label: "Google Ads",    color: "#10b981", icon: "G", img: "/icon-google-ads.png" },
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
  gclid?: string | null;
  googleCampaignId?: string | null;
  googleAdGroupId?: string | null;
  googleAdId?: string | null;
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

interface Pagination {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

interface Props {
  conversations: Conversation[];
  funnelStages: FunnelStage[];
  stats: { total: number; metaAds: number; googleAds: number; untracked: number };
  pagination: Pagination;
  activeOrigin: string;
}

export function ConversationsClient({ conversations, funnelStages, stats, pagination, activeOrigin }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState(activeOrigin);
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
  const [sortKey, setSortKey] = useState<"name" | "origin" | "funnelStage" | "firstMessageAt" | "lastMessageAt">("lastMessageAt")
  const [termsAccepted, setTermsAccepted] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("pingo_audit_terms_accepted") === "1"
  );
  const [showTerms, setShowTerms] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [pendingConvId, setPendingConvId] = useState<string | null>(null);
  const [originMenuOpen, setOriginMenuOpen] = useState(false);
  const [changingOrigin, setChangingOrigin] = useState(false);;
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [campaignDropOpen, setCampaignDropOpen] = useState(false);

  useEffect(() => {
    fetch("/api/workspace/meta/campaigns")
      .then((r) => r.ok ? r.json() : { campaigns: [] })
      .then((d) => setCampaigns(d.campaigns ?? []))
      .catch(() => {});
  }, []);

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

  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  const refreshList = useCallback(() => {
    const { page, pageSize } = paginationRef.current;
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (activeOrigin && activeOrigin !== "all") params.set("origin", activeOrigin);
    return fetch(`/api/conversations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.conversations;
        if (Array.isArray(list) && list.length > 0) {
          setLocalConvs(list);
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
        const { page, pageSize } = paginationRef.current;
        const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
        if (activeOrigin && activeOrigin !== "all") params.set("origin", activeOrigin);
        const res = await fetch(`/api/conversations?${params}`);
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : raw.conversations;
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

  async function handleChangeOrigin(convId: string, newOrigin: string) {
    setChangingOrigin(true);
    const res = await fetch(`/api/conversations/${convId}/origin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: newOrigin }),
    });
    setChangingOrigin(false);
    if (res.ok) {
      setLocalConvs((c) => c.map((x) => x.id === convId ? { ...x, origin: newOrigin } : x));
      if (detail?.id === convId) setDetail((d) => d ? { ...d, origin: newOrigin } : d);
      setOriginMenuOpen(false);
      toast.success(`Origem alterada para "${ORIGIN_CONFIG[newOrigin]?.label ?? newOrigin}"`);
    } else {
      toast.error("Erro ao alterar origem");
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
              { key: "untracked",  label: "Não Rastreada", value: stats.untracked,  color: "text-amber-400" },
            ].map(({ key, label, value, color }) => (
              <button key={key} onClick={() => {
                setOriginFilter(key);
                const params = new URLSearchParams();
                if (key !== "all") params.set("origin", key);
                router.push(`/conversations${params.toString() ? `?${params}` : ""}`);
              }}
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
                        onClick={() => {
                          setOriginFilter(key);
                          setOriginDropOpen(false);
                          const params = new URLSearchParams();
                          if (key !== "all") params.set("origin", key);
                          router.push(`/conversations${params.toString() ? `?${params}` : ""}`);
                        }}
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
                onClick={() => { setOriginFilter("all"); setAdvanced(emptyAdvanced); setSearch(""); router.push("/conversations"); }}
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

                {/* UTM Campaign — dropdown se Meta Ads conectado */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                    Campanha
                    {campaigns.length > 0 && (
                      <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                        <Megaphone className="w-2.5 h-2.5" /> Meta Ads
                      </span>
                    )}
                  </label>
                  {campaigns.length > 0 ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setCampaignDropOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-left hover:border-zinc-600 transition-colors"
                      >
                        <span className={advanced.utmCampaign ? "text-zinc-100 truncate" : "text-zinc-500"}>
                          {advanced.utmCampaign || "Todas as campanhas"}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform ${campaignDropOpen ? "rotate-180" : ""}`} />
                      </button>
                      {campaignDropOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setCampaignDropOpen(false)} />
                          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => { setAdv({ utmCampaign: "" }); setCampaignDropOpen(false); }}
                              className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 transition-colors italic"
                            >
                              Todas as campanhas
                            </button>
                            {campaigns.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => { setAdv({ utmCampaign: c.name }); setCampaignDropOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                                  advanced.utmCampaign === c.name ? "bg-blue-500/10 text-blue-300" : "text-zinc-300 hover:bg-zinc-800"
                                }`}
                              >
                                <span className="truncate">{c.name}</span>
                                <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded-full font-medium ${
                                  c.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-700 text-zinc-500"
                                }`}>
                                  {c.status === "ACTIVE" ? "Ativa" : "Pausada"}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <Input
                      value={advanced.utmCampaign}
                      onChange={(e) => setAdv({ utmCampaign: e.target.value })}
                      placeholder="nome-da-campanha"
                      className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 text-sm"
                    />
                  )}
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
                          {origin.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={origin.img} alt={origin.label} className="w-4 h-4 object-contain" />
                          ) : (
                            <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center" style={{ background: `${origin.color}20` }}>
                              {origin.icon}
                            </span>
                          )}
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
                      <button onClick={() => {
                        if (conv.id === selectedId) { setSelectedId(null); return; }
                        if (!termsAccepted) { setPendingConvId(conv.id); setShowTerms(true); }
                        else setSelectedId(conv.id);
                      }}
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

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 mt-1">
              <p className="text-xs text-zinc-500">
                Página {pagination.page} de {pagination.totalPages} · {pagination.totalCount} conversas
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set("page", String(pagination.page - 1));
                    if (activeOrigin && activeOrigin !== "all") params.set("origin", activeOrigin);
                    router.push(`/conversations?${params}`);
                  }}
                  className="h-7 w-7 p-0 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - pagination.page) <= 2)
                  .map(p => (
                    <Button
                      key={p}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("page", String(p));
                        if (activeOrigin && activeOrigin !== "all") params.set("origin", activeOrigin);
                        router.push(`/conversations?${params}`);
                      }}
                      className={`h-7 w-7 p-0 border-zinc-700 text-xs ${
                        p === pagination.page
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {p}
                    </Button>
                  ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set("page", String(pagination.page + 1));
                    if (activeOrigin && activeOrigin !== "all") params.set("origin", activeOrigin);
                    router.push(`/conversations?${params}`);
                  }}
                  className="h-7 w-7 p-0 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Termos de Auditoria */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-100">Auditoria da Conversa</h2>
              <button onClick={() => { setShowTerms(false); setPendingConvId(null); setTermsChecked(false); }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3 text-sm text-zinc-400 leading-relaxed">
                <p>
                  Você está prestes a receber acesso às conversas realizadas entre seus clientes e os leads,
                  viabilizadas pela nossa plataforma. Esse acesso tem como finalidade possibilitar análises
                  estratégicas relacionadas a dados comerciais, métricas de vendas, desempenho de tráfego e similares.
                </p>
                <p className="text-zinc-300 font-medium">Ao prosseguir, você declara estar ciente de que:</p>
                <ol className="space-y-2 list-none">
                  <li><span className="text-zinc-200 font-semibold">I.</span> As informações acessadas são confidenciais e devem ser tratadas com responsabilidade e sigilo absoluto;</li>
                  <li><span className="text-zinc-200 font-semibold">II.</span> O uso dessas informações deve se restringir às finalidades comerciais e analíticas para as quais foram disponibilizadas;</li>
                  <li><span className="text-zinc-200 font-semibold">III.</span> É sua responsabilidade garantir que seus clientes estejam cientes e de acordo com esse acesso e com a finalidade proposta.</li>
                </ol>
                <p>Você confirma que está ciente dessas condições e deseja continuar?</p>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-emerald-500 cursor-pointer"
                />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Declaro que estou ciente dessas condições.
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800">
              <button
                disabled={!termsChecked}
                onClick={() => {
                  localStorage.setItem("pingo_audit_terms_accepted", "1");
                  setTermsAccepted(true);
                  setShowTerms(false);
                  if (pendingConvId) setSelectedId(pendingConvId);
                  setPendingConvId(null);
                  setTermsChecked(false);
                }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed
                  bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                Autorizar e continuar
              </button>
            </div>
          </div>
        </div>
      )}

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

          {detail?.gclid && (
            <div className="px-4 py-3 border-b border-zinc-800 shrink-0 bg-emerald-500/5">
              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google Ads — lead rastreado
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {detail.googleCampaignId && (
                  <p className="text-xs text-zinc-400"><span className="text-zinc-600">Campanha ID:</span> {detail.googleCampaignId}</p>
                )}
                {detail.googleAdGroupId && (
                  <p className="text-xs text-zinc-400"><span className="text-zinc-600">Grupo ID:</span> {detail.googleAdGroupId}</p>
                )}
                {detail.googleAdId && (
                  <p className="text-xs text-zinc-400"><span className="text-zinc-600">Anúncio ID:</span> {detail.googleAdId}</p>
                )}
                <p className="text-xs text-zinc-600 col-span-2 truncate">gclid: {detail.gclid?.slice(0, 24)}…</p>
              </div>
            </div>
          )}

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

          <div className="p-4 border-t border-zinc-800 shrink-0 space-y-2">
            {/* Alterar Origem */}
            <div className="relative">
              <Button
                onClick={() => setOriginMenuOpen((v) => !v)}
                disabled={changingOrigin}
                variant="outline"
                className="w-full border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-medium gap-2 justify-start"
              >
                {(() => {
                  const o = ORIGIN_CONFIG[detail?.origin ?? "untracked"];
                  return (
                    <>
                      {o?.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.img} alt={o.label} className="w-4 h-4 object-contain shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: o?.color ?? "#f59e0b" }} />
                      )}
                      Origem: {o?.label ?? "Não Rastreada"}
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </>
                  );
                })()}
              </Button>
              {originMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOriginMenuOpen(false)} />
                  <div className="absolute bottom-11 left-0 right-0 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1">
                    {Object.entries(ORIGIN_CONFIG).map(([key, cfg]) => (
                      <button key={key}
                        onClick={() => selectedId && handleChangeOrigin(selectedId, key)}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                          detail?.origin === key ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        }`}
                      >
                        {cfg.img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cfg.img} alt={cfg.label} className="w-4 h-4 object-contain shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center shrink-0" style={{ background: `${cfg.color}20`, color: cfg.color }}>{cfg.icon}</span>
                        )}
                        {cfg.label}
                        {detail?.origin === key && <span className="ml-auto text-emerald-400 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Alterar Etapa */}
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
