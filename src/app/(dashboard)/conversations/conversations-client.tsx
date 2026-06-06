"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MessageSquare, Search, X, Zap, ChevronDown,
  Clock, Star, Eye, GitBranch, Info, RefreshCw,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ORIGIN_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  meta_ads: { label: "Meta Ads", color: "#3b82f6", icon: "M" },
  google_ads: { label: "Google Ads", color: "#10b981", icon: "G" },
  organic: { label: "Orgânico", color: "#8b5cf6", icon: "O" },
  untracked: { label: "Não Rastreada", color: "#f59e0b", icon: "?" },
};

interface FunnelStage { id: string; name: string; color: string; }
interface Conversation {
  id: string; phone: string; name: string | null;
  origin: string; leadScore: number;
  funnelStageId: string | null;
  funnelStage: FunnelStage | null;
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

interface Props {
  conversations: Conversation[];
  funnelStages: FunnelStage[];
  stats: { total: number; metaAds: number; googleAds: number; organic: number; untracked: number };
}

export function ConversationsClient({ conversations, funnelStages, stats }: Props) {
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState("all");
  const [localConvs, setLocalConvs] = useState(conversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [changingStage, setChangingStage] = useState(false);
  const [stageMenuFor, setStageMenuFor] = useState<string | null>(null);
  // syncing = true quando a lista está vazia ao carregar (auto-import em andamento)
  const [syncing, setSyncing] = useState(conversations.length === 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

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

  // Polling quando a lista está vazia (auto-import rodando em background)
  useEffect(() => {
    if (!syncing) return;
    let attempts = 0;
    const maxAttempts = 20; // 20 × 3s = 60s máximo
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

  // Load conversation detail
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setLoadingDetail(true);
    fetch(`/api/conversations/${selectedId}`)
      .then((r) => r.json())
      .then((d) => { setDetail(d); setLoadingDetail(false); });
  }, [selectedId]);

  // Polling a cada 8s — mais confiável que SSE no Vercel Hobby (limite 10s/função)
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

        // Verifica se a conversa aberta tem mensagens novas
        if (selectedIdRef.current) {
          const updated = data.find((c: Conversation) => c.id === selectedIdRef.current);
          const current = localConvs.find(c => c.id === selectedIdRef.current);
          if (updated && current && String(updated.lastMessageAt) !== String(current.lastMessageAt)) {
            fetch(`/api/conversations/${selectedIdRef.current}`)
              .then(r => r.json())
              .then(d => setDetail(d));
          }
        }
      } catch { /* ignora erro de rede */ }
    }, 8000);

    return () => clearInterval(poll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  const filtered = localConvs.filter((c) => {
    const matchSearch = !search ||
      (c.name?.toLowerCase().includes(search.toLowerCase())) ||
      c.phone.includes(search);
    const matchOrigin = originFilter === "all" || c.origin === originFilter;
    return matchSearch && matchOrigin;
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
      setLocalConvs((c) =>
        c.map((x) => x.id === convId ? { ...x, funnelStageId: stageId, funnelStage: stage } : x)
      );
      if (detail?.id === convId) setDetail((d) => d ? { ...d, funnelStageId: stageId, funnelStage: stage } : d);
      setStageMenuFor(null);
      toast.success(stage ? `Movido para "${stage.name}"` : "Removido do funil");
    }
  }

  const initials = (conv: Conversation) =>
    (conv.name ?? conv.phone).charAt(0).toUpperCase();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main table */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all ${selectedId ? "mr-0" : ""}`}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Conversas
            </h1>
          </div>

          {/* Banner de sincronização */}
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
              { key: "all", label: "Total", value: stats.total, color: "text-zinc-300" },
              { key: "meta_ads", label: "Meta Ads", value: stats.metaAds, color: "text-blue-400" },
              { key: "google_ads", label: "Google Ads", value: stats.googleAds, color: "text-emerald-400" },
              { key: "organic", label: "Orgânico", value: stats.organic, color: "text-violet-400" },
              { key: "untracked", label: "Não Rastreada", value: stats.untracked, color: "text-amber-400" },
            ].map(({ key, label, value, color }) => (
              <button
                key={key}
                onClick={() => setOriginFilter(key)}
                className={`flex items-center gap-1.5 transition-all ${originFilter === key ? "opacity-100" : "opacity-50 hover:opacity-75"}`}
              >
                <span className={`text-xl font-bold ${color}`}>{value}</span>
                <span className="text-xs text-zinc-500">{label}</span>
              </button>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Telefone ou nome..."
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 pl-9"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span>Contato</span>
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
                        { stars: 1, label: "Só fez contato", color: "text-zinc-500" },
                        { stars: 2, label: "Algum engajamento", color: "text-zinc-400" },
                        { stars: 3, label: "Evento de pixel disparado", color: "text-amber-500" },
                        { stars: 4, label: "Múltiplos eventos", color: "text-amber-400" },
                        { stars: 5, label: "Lead muito qualificado", color: "text-amber-300" },
                      ].map((item) => (
                        <div key={item.stars} className="flex items-center gap-2">
                          <div className="flex gap-0.5 shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-2.5 h-2.5 ${i < item.stars ? `fill-amber-400 text-amber-400` : "text-zinc-700"}`} />
                            ))}
                          </div>
                          <span className={`text-xs ${item.color}`}>{item.label}</span>
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
              <span>Origem</span>
              <span>Etapa da Jornada</span>
              <span>Primeira Msg</span>
              <span>Última Msg</span>
              <span></span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-10 text-center text-zinc-600 text-sm">
                {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
              </div>
            ) : (
              filtered.map((conv) => {
                const origin = ORIGIN_CONFIG[conv.origin];
                const isSelected = conv.id === selectedId;
                const stars = Math.min(Math.floor(conv.leadScore / 20), 5);

                return (
                  <div
                    key={conv.id}
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
                        <p className="text-sm font-medium text-zinc-100 truncate">
                          {conv.name ?? conv.phone}
                        </p>
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
                          {/* Score tooltip */}
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
                      {origin && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: origin.color }}>
                          <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center"
                            style={{ background: `${origin.color}20` }}>
                            {origin.icon}
                          </span>
                          {origin.label}
                        </span>
                      )}
                    </div>

                    {/* Etapa */}
                    <div className="flex items-center relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStageMenuFor(stageMenuFor === conv.id ? null : conv.id);
                        }}
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
                            <button
                              onClick={() => handleChangeStage(conv.id, null)}
                              className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-zinc-400 hover:bg-zinc-800 rounded-lg"
                            >
                              <span className="w-2 h-2 rounded-full bg-zinc-600" />
                              Sem etapa
                            </button>
                            {funnelStages.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => handleChangeStage(conv.id, s.id)}
                                className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg"
                              >
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
                      <button
                        onClick={() => setSelectedId(conv.id === selectedId ? null : conv.id)}
                        title="Visualizar conversa"
                        className={`p-1.5 rounded-lg transition-all ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Conversation detail panel */}
      {selectedId && (
        <div className="w-96 shrink-0 border-l border-zinc-800 bg-zinc-900/80 flex flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300">
                {detail ? initials(detail) : "?"}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  {detail?.name ?? detail?.phone ?? "..."}
                </p>
                {detail?.name && <p className="text-xs text-zinc-500">{detail.phone}</p>}
              </div>
            </div>
            <button onClick={() => setSelectedId(null)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
                Carregando mensagens...
              </div>
            ) : detail?.messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
                Nenhuma mensagem registrada
              </div>
            ) : (
              detail?.messages.map((msg) => {
                const isOutbound = msg.direction === "outbound";
                return (
                  <div key={msg.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isOutbound
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                      }`}
                    >
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

          {/* Pixel fires */}
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

          {/* Change stage button */}
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
                    <button
                      onClick={() => { handleChangeStage(selectedId, null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 rounded-lg"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                      Sem etapa
                    </button>
                    {funnelStages.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { handleChangeStage(selectedId, s.id); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg"
                      >
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
