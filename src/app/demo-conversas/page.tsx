"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Search, X, Zap, ChevronDown, Info,
  Clock, Star, Eye, GitBranch,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const mockWorkspace = { id: "demo", name: "Clínica Bella Forma", whatsappConnected: true, whatsappPhone: "5511994000100", role: "owner" };
const mockAllWorkspaces = [
  mockWorkspace,
  { id: "d2", name: "Studio Fit Academia", whatsappConnected: true, whatsappPhone: "5521991002233", role: "owner" },
  { id: "d3", name: "Imobiliária Prime", whatsappConnected: true, whatsappPhone: "5531988550044", role: "owner" },
];

const STAGES = [
  { id: "s1", name: "Fez Contato", color: "#3b82f6" },
  { id: "s2", name: "Agendou", color: "#8b5cf6" },
  { id: "s3", name: "Comprou", color: "#10b981" },
  { id: "s4", name: "Perdido", color: "#ef4444" },
];

const ORIGIN: Record<string, { label: string; color: string; icon: string }> = {
  meta_ads: { label: "Meta Ads", color: "#3b82f6", icon: "M" },
  untracked: { label: "Não Rastreada", color: "#f59e0b", icon: "?" },
};

const now = new Date();
const h = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000);
const m = (n: number) => new Date(now.getTime() - n * 60 * 1000);

const CONVERSATIONS = [
  { id: "c1", phone: "(11) 99481-2043", name: "Beatriz Almeida",   origin: "meta_ads",  leadScore: 95,  funnelStageId: "s2", firstMessageAt: h(2),   lastMessageAt: m(2) },
  { id: "c2", phone: "(21) 98765-4321", name: "Rafael Torres",     origin: "meta_ads",  leadScore: 80,  funnelStageId: "s2", firstMessageAt: h(48),  lastMessageAt: m(11) },
  { id: "c3", phone: "(31) 99642-0187", name: "Camila Ferreira",   origin: "meta_ads",  leadScore: 100, funnelStageId: "s3", firstMessageAt: h(6),   lastMessageAt: m(34) },
  { id: "c4", phone: "(41) 98873-1290", name: null,                origin: "untracked", leadScore: 10,  funnelStageId: "s1", firstMessageAt: h(72),  lastMessageAt: m(58) },
  { id: "c5", phone: "(19) 99203-8471", name: "Mariana Gomes",     origin: "meta_ads",  leadScore: 70,  funnelStageId: "s2", firstMessageAt: h(120), lastMessageAt: h(2) },
  { id: "c6", phone: "(11) 99812-3456", name: "André Nascimento",  origin: "meta_ads",  leadScore: 55,  funnelStageId: null, firstMessageAt: h(3),   lastMessageAt: m(10) },
  { id: "c7", phone: "(11) 99384-7210", name: "Fernanda Costa",    origin: "meta_ads",  leadScore: 90,  funnelStageId: "s2", firstMessageAt: h(8),   lastMessageAt: h(1) },
  { id: "c8", phone: "(21) 99600-1122", name: null,                origin: "untracked", leadScore: 5,   funnelStageId: "s1", firstMessageAt: h(4),   lastMessageAt: h(3) },
];

const MESSAGES: Record<string, { id: string; direction: string; content: string; timestamp: Date }[]> = {
  c1: [
    { id: "m0a", direction: "inbound",  content: "Oi! Vi o anúncio de vocês no Instagram. Quero fazer harmonização facial 😍", timestamp: h(2) },
    { id: "m0b", direction: "outbound", content: "Olá Beatriz! Bem-vinda 😊 Temos ótimas opções de harmonização. Posso te passar os valores e agendar uma avaliação gratuita?", timestamp: h(2) },
    { id: "m0c", direction: "inbound",  content: "Sim por favor! Tenho disponibilidade essa semana", timestamp: m(30) },
    { id: "m0d", direction: "outbound", content: "Ótimo! Temos quinta às 15h ou sexta às 10h. Qual prefere?", timestamp: m(25) },
    { id: "m0e", direction: "inbound",  content: "Quinta às 15h perfeito! 🥰", timestamp: m(2) },
  ],
  c2: [
    { id: "m10", direction: "inbound",  content: "Oi, vi o anúncio de vocês no Facebook. Quero saber mais sobre o clareamento dental 😊", timestamp: h(48) },
    { id: "m11", direction: "outbound", content: "Olá Rafael! Tudo bem? 😊 Temos clareamento a laser com resultado incrível. Posso agendar uma avaliação gratuita?", timestamp: h(47) },
    { id: "m12", direction: "inbound",  content: "Pode sim! Qual o preço aproximado?", timestamp: h(47) },
    { id: "m13", direction: "outbound", content: "A avaliação é gratuita! O tratamento fica entre R$ 800 a R$ 1.200. Posso agendar essa semana?", timestamp: h(46) },
    { id: "m14", direction: "inbound",  content: "Quinta-feira às 14h serve pra mim 👍", timestamp: h(46) },
    { id: "m15", direction: "outbound", content: "Anotado, Rafael! Quinta-feira às 14h. Nos vemos lá! 🦷✨", timestamp: h(45) },
  ],
  c3: [
    { id: "m20", direction: "inbound",  content: "Oi! Vi o anúncio de vocês. Quero fazer botox e preenchimento labial 💉", timestamp: h(6) },
    { id: "m21", direction: "outbound", content: "Olá Camila! Trabalhamos com os melhores produtos do mercado 🥰 Vamos agendar sua avaliação?", timestamp: h(6) },
    { id: "m22", direction: "inbound",  content: "Sim! Pode ser amanhã de manhã?", timestamp: h(5) },
    { id: "m23", direction: "outbound", content: "Perfeito! Amanhã às 9h está ótimo. Confirma?", timestamp: h(5) },
    { id: "m24", direction: "inbound",  content: "Confirmado! 💚", timestamp: h(4) },
    { id: "m25", direction: "outbound", content: "Às 9h te esperamos! 😊", timestamp: h(3) },
    { id: "m26", direction: "inbound",  content: "Adorei o resultado!! Já indiquei pra duas amigas 🥹", timestamp: m(34) },
    { id: "m27", direction: "outbound", content: "Que maravilha Camila!! Fico feliz demais 🥹❤️ Temos desconto especial para indicações!", timestamp: m(30) },
  ],
  c7: [
    { id: "m30", direction: "inbound",  content: "Boa tarde! Vi o anúncio de lifting facial. Gostaria de mais informações 🙏", timestamp: h(8) },
    { id: "m31", direction: "outbound", content: "Boa tarde Fernanda! Temos ótimas opções de bioestimuladores e lifting sem cirurgia. Posso te chamar para uma avaliação?", timestamp: h(8) },
    { id: "m32", direction: "inbound",  content: "Com certeza! Quanto tempo dura o efeito?", timestamp: h(7) },
    { id: "m33", direction: "outbound", content: "De 12 a 18 meses dependendo do procedimento. Avaliação gratuita para você conhecer o resultado!", timestamp: h(7) },
    { id: "m34", direction: "inbound",  content: "Ótimo! Me agenda para sexta à tarde", timestamp: h(2) },
    { id: "m35", direction: "outbound", content: "Sexta às 16h anotado! Até lá 😊", timestamp: h(1) },
  ],
};

const PIXEL_FIRES: Record<string, { id: string; eventName: string; success: boolean }[]> = {
  c1: [{ id: "pf1", eventName: "Lead", success: true }, { id: "pf2", eventName: "InitiateCheckout", success: true }],
  c2: [{ id: "pf3", eventName: "Lead", success: true }, { id: "pf4", eventName: "Schedule", success: true }],
  c3: [{ id: "pf5", eventName: "Lead", success: true }, { id: "pf6", eventName: "Purchase", success: true }],
  c5: [{ id: "pf7", eventName: "Lead", success: true }],
  c7: [{ id: "pf8", eventName: "Lead", success: true }, { id: "pf9", eventName: "Schedule", success: true }, { id: "pf10", eventName: "Purchase", success: true }],
};

export default function DemoConversasPage() {
  const [selectedId, setSelectedId] = useState<string | null>("c1");
  const [stages, setStages] = useState(CONVERSATIONS.map(c => ({ id: c.id, stageId: c.funnelStageId })));
  const [stageMenuFor, setStageMenuFor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId]);

  const getStage = (convId: string) => {
    const stageId = stages.find(s => s.id === convId)?.stageId;
    return STAGES.find(s => s.id === stageId) ?? null;
  };

  function changeStage(convId: string, stageId: string | null) {
    setStages(s => s.map(x => x.id === convId ? { ...x, stageId } : x));
    setStageMenuFor(null);
  }

  const detail = selectedId ? {
    conv: CONVERSATIONS.find(c => c.id === selectedId)!,
    messages: MESSAGES[selectedId] ?? [],
    pixelFires: PIXEL_FIRES[selectedId] ?? [],
  } : null;

  const stats = { total: CONVERSATIONS.length, metaAds: CONVERSATIONS.filter(c => c.origin === "meta_ads").length, untracked: CONVERSATIONS.filter(c => c.origin === "untracked").length };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeWorkspace={mockWorkspace} allWorkspaces={mockAllWorkspaces} />
        <div className="flex flex-1 overflow-hidden">

          {/* Table */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pt-5 pb-3 shrink-0 space-y-3">
              <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" /> Conversas
              </h1>
              <div className="flex items-center gap-5 text-sm">
                <span className="flex items-center gap-1.5"><span className="text-2xl font-bold text-zinc-200">{stats.total}</span><span className="text-xs text-zinc-500">Total</span></span>
                <span className="flex items-center gap-1.5"><span className="text-2xl font-bold text-blue-400">{stats.metaAds}</span><span className="text-xs text-zinc-500">Meta Ads</span></span>
                <span className="flex items-center gap-1.5"><span className="text-2xl font-bold text-amber-400">{stats.untracked}</span><span className="text-xs text-zinc-500">Não Rastreada</span></span>
              </div>
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input placeholder="Telefone ou nome..." className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 pl-9" readOnly />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] gap-4 px-4 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span>Contato</span>
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-zinc-700 hover:text-zinc-400 cursor-help transition-colors" />
                      <div className="absolute left-0 top-5 z-30 hidden group-hover:block w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3.5 text-left normal-case tracking-normal font-normal">
                        <p className="text-xs font-semibold text-zinc-200 mb-2 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Lead Score
                        </p>
                        <p className="text-xs text-zinc-400 mb-2.5 leading-relaxed">
                          Pontuação automática de 0 a 100 que indica o quão qualificado é o lead.
                        </p>
                        <div className="space-y-1.5 border-t border-zinc-800 pt-2.5">
                          {[
                            { stars: 1, label: "Só fez contato" },
                            { stars: 2, label: "Algum engajamento" },
                            { stars: 3, label: "Evento de pixel disparado" },
                            { stars: 4, label: "Múltiplos eventos" },
                            { stars: 5, label: "Lead muito qualificado 🔥" },
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
                  <span>Origem</span><span>Etapa da Jornada</span>
                  <span>Primeira Msg</span><span>Última Msg</span><span></span>
                </div>

                {CONVERSATIONS.map((conv) => {
                  const origin = ORIGIN[conv.origin];
                  const stage = getStage(conv.id);
                  const stars = Math.min(Math.floor(conv.leadScore / 20), 5);
                  const isSelected = conv.id === selectedId;
                  const pf = PIXEL_FIRES[conv.id] ?? [];
                  const initials = (conv.name ?? conv.phone).charAt(0).toUpperCase();

                  return (
                    <div key={conv.id}
                      className={`grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] gap-4 px-4 py-3.5 border-b border-zinc-800/50 last:border-0 transition-all ${isSelected ? "bg-emerald-500/5 border-l-2 border-l-emerald-500" : "hover:bg-zinc-800/30"}`}>

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300 shrink-0">{initials}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-100 truncate">{conv.name ?? conv.phone}</p>
                          {conv.name && <p className="text-xs text-zinc-600 truncate">{conv.phone}</p>}
                          <div className="flex items-center gap-0.5 mt-0.5 relative group/score">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-2.5 h-2.5 ${i < stars ? "text-amber-400 fill-amber-400" : "text-zinc-800"}`} />
                            ))}
                            {pf.length > 0 && <span className="ml-1.5 text-xs text-violet-400 flex items-center gap-0.5"><Zap className="w-3 h-3" />{pf.length}</span>}
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

                      <div className="flex items-center">
                        {origin && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: origin.color }}>
                            <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center" style={{ background: `${origin.color}20` }}>{origin.icon}</span>
                            {origin.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center relative">
                        <button onClick={() => setStageMenuFor(stageMenuFor === conv.id ? null : conv.id)}
                          className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80">
                          {stage ? (
                            <><span className="w-2 h-2 rounded-full shrink-0" style={{ background: stage.color }} /><span style={{ color: stage.color }}>{stage.name}</span></>
                          ) : <span className="text-zinc-600">— sem etapa</span>}
                          <ChevronDown className="w-3 h-3 text-zinc-600" />
                        </button>
                        {stageMenuFor === conv.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setStageMenuFor(null)} />
                            <div className="absolute left-0 top-7 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1 min-w-44">
                              <button onClick={() => changeStage(conv.id, null)} className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-zinc-400 hover:bg-zinc-800 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-zinc-600" /> Sem etapa
                              </button>
                              {STAGES.map(s => (
                                <button key={s.id} onClick={() => changeStage(conv.id, s.id)} className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />{s.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center text-xs text-zinc-500">
                        <Clock className="w-3 h-3 mr-1 shrink-0" />{format(conv.firstMessageAt, "dd/MM/yy HH:mm")}
                      </div>
                      <div className="flex items-center text-xs text-zinc-400">
                        {formatDistanceToNow(conv.lastMessageAt, { locale: ptBR, addSuffix: true })}
                      </div>
                      <div className="flex items-center justify-end">
                        <button onClick={() => setSelectedId(conv.id === selectedId ? null : conv.id)}
                          className={`p-1.5 rounded-lg transition-all ${isSelected ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"}`}>
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detail panel */}
          {selectedId && detail && (
            <div className="w-96 shrink-0 border-l border-zinc-800 bg-zinc-900/80 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300">
                    {(detail.conv.name ?? detail.conv.phone).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{detail.conv.name ?? detail.conv.phone}</p>
                    {detail.conv.name && <p className="text-xs text-zinc-500">{detail.conv.phone}</p>}
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-zinc-600 hover:text-zinc-300 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {detail.messages.map((msg) => {
                  const isOut = msg.direction === "outbound";
                  return (
                    <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isOut ? "bg-emerald-600 text-white rounded-br-sm" : "bg-zinc-800 text-zinc-100 rounded-bl-sm"}`}>
                        {msg.content === "[mídia]" ? (
                          <span className="italic text-xs opacity-70">📎 Mídia</span>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                        <p className={`text-[10px] mt-1 ${isOut ? "text-emerald-200" : "text-zinc-500"}`}>
                          {format(msg.timestamp, "dd/MM 'às' HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {detail.pixelFires.length > 0 && (
                <div className="px-4 py-2 border-t border-zinc-800 shrink-0">
                  <p className="text-xs font-semibold text-zinc-500 mb-1.5">Eventos Pixel disparados</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.pixelFires.map(pf => (
                      <Badge key={pf.id} className="text-xs gap-1 bg-violet-500/10 text-violet-400 border-violet-500/20">
                        <Zap className="w-3 h-3" />{pf.eventName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-zinc-800 shrink-0 relative">
                <Button
                  onClick={() => setStageMenuFor(stageMenuFor === `panel` ? null : `panel`)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
                >
                  <GitBranch className="w-4 h-4" />
                  {getStage(selectedId) ? `Etapa: ${getStage(selectedId)!.name}` : "Alterar Etapa da Jornada"}
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </Button>
                {stageMenuFor === `panel` && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStageMenuFor(null)} />
                    <div className="absolute bottom-16 left-4 right-4 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1">
                      <button onClick={() => changeStage(selectedId, null)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />Sem etapa
                      </button>
                      {STAGES.map(s => (
                        <button key={s.id} onClick={() => changeStage(selectedId, s.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />{s.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
