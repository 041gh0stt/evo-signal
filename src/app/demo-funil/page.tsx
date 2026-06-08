"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  GitBranch, Settings2, Plus, GripVertical,
  MessageSquare, Zap, Star, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ORIGIN_CONFIG: Record<string, { label: string; color: string }> = {
  meta_ads: { label: "Meta Ads", color: "#3b82f6" },
  untracked: { label: "Orgânico", color: "#f59e0b" },
};

const mockStages = [
  { id: "s1", name: "Novo Lead", color: "#3b82f6", order: 0 },
  { id: "s2", name: "Em Negociação", color: "#8b5cf6", order: 1 },
  { id: "s3", name: "Proposta Enviada", color: "#f59e0b", order: 2 },
  { id: "s4", name: "Fechado ✓", color: "#10b981", order: 3 },
];

const mockConversations = [
  { id: "1",  phone: "5511994821043", name: "Beatriz Almeida",   origin: "meta_ads",  leadScore: 95,  funnelStageId: "s2", _count: { messages: 18, pixelFires: 3 } },
  { id: "2",  phone: "5521987654321", name: "Rafael Torres",     origin: "meta_ads",  leadScore: 80,  funnelStageId: "s3", _count: { messages: 9,  pixelFires: 2 } },
  { id: "3",  phone: "5531996420187", name: "Camila Ferreira",   origin: "meta_ads",  leadScore: 100, funnelStageId: "s4", _count: { messages: 31, pixelFires: 4 } },
  { id: "4",  phone: "5541988731290", name: "Lucas Martins",     origin: "untracked", leadScore: 15,  funnelStageId: null, _count: { messages: 2,  pixelFires: 0 } },
  { id: "5",  phone: "5511992038471", name: "Mariana Gomes",     origin: "meta_ads",  leadScore: 70,  funnelStageId: "s1", _count: { messages: 14, pixelFires: 2 } },
  { id: "6",  phone: "5519981234567", name: "André Nascimento",  origin: "meta_ads",  leadScore: 55,  funnelStageId: "s3", _count: { messages: 7,  pixelFires: 1 } },
  { id: "7",  phone: "5511993847210", name: "Fernanda Costa",    origin: "meta_ads",  leadScore: 90,  funnelStageId: "s2", _count: { messages: 22, pixelFires: 3 } },
  { id: "8",  phone: "5521996001122", name: "Diego Carvalho",    origin: "untracked", leadScore: 30,  funnelStageId: "s1", _count: { messages: 4,  pixelFires: 0 } },
  { id: "9",  phone: "5531977884433", name: "Priscila Santos",   origin: "meta_ads",  leadScore: 85,  funnelStageId: "s4", _count: { messages: 19, pixelFires: 2 } },
  { id: "10", phone: "5511998271634", name: "Thiago Pereira",    origin: "meta_ads",  leadScore: 60,  funnelStageId: "s2", _count: { messages: 11, pixelFires: 1 } },
  { id: "11", phone: "5561991203847", name: "Júlia Rodrigues",   origin: "untracked", leadScore: 20,  funnelStageId: null, _count: { messages: 3,  pixelFires: 0 } },
  { id: "12", phone: "5511994556677", name: "Eduardo Lima",      origin: "meta_ads",  leadScore: 75,  funnelStageId: "s1", _count: { messages: 8,  pixelFires: 1 } },
];

export default function DemoFunilPage() {
  const [conversations, setConversations] = useState(mockConversations);
  const [stages] = useState(mockStages);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  function onDrop(stageId: string | null) {
    if (!dragging) return;
    setConversations((c) => c.map((x) => x.id === dragging ? { ...x, funnelStageId: stageId } : x));
    setDragging(null);
    setDragOver(null);
  }

  const inbox = conversations.filter((c) => !c.funnelStageId);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              Funil de Vendas
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">{conversations.length} conversas · {conversations.filter(c => c.funnelStageId === "s4").length} fechadas hoje</p>
          </div>
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1.5">
            <Settings2 className="w-4 h-4" /> Configurar Estágios
          </Button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 p-6 h-full min-w-max">
            {/* Inbox */}
            <Column id="inbox" title="Entrada" color="#6b7280" convs={inbox} isDragOver={dragOver === "inbox"}
              onDragOver={() => setDragOver("inbox")} onDrop={() => onDrop(null)}
              onDragStart={setDragging} onDragEnd={() => { setDragging(null); setDragOver(null); }}
              onMove={(cid, sid) => setConversations((c) => c.map((x) => x.id === cid ? { ...x, funnelStageId: sid } : x))}
              stages={stages} currentStageId={null}
            />
            {stages.map((s) => (
              <Column key={s.id} id={s.id} title={s.name} color={s.color}
                convs={conversations.filter((c) => c.funnelStageId === s.id)}
                isDragOver={dragOver === s.id}
                onDragOver={() => setDragOver(s.id)} onDrop={() => onDrop(s.id)}
                onDragStart={setDragging} onDragEnd={() => { setDragging(null); setDragOver(null); }}
                onMove={(cid, sid) => setConversations((c) => c.map((x) => x.id === cid ? { ...x, funnelStageId: sid } : x))}
                stages={stages} currentStageId={s.id}
              />
            ))}
            <button className="w-64 shrink-0 h-20 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all self-start">
              <Plus className="w-4 h-4" /><span className="text-sm">Novo estágio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ id, title, color, convs, isDragOver, onDragOver, onDrop, onDragStart, onDragEnd, onMove, stages, currentStageId }: {
  id: string; title: string; color: string;
  convs: typeof mockConversations;
  isDragOver: boolean;
  onDragOver: () => void; onDrop: () => void;
  onDragStart: (id: string) => void; onDragEnd: () => void;
  onMove: (convId: string, stageId: string | null) => void;
  stages: typeof mockStages;
  currentStageId: string | null;
}) {
  return (
    <div
      className="w-64 shrink-0 flex flex-col rounded-xl bg-zinc-900/60 border border-zinc-800 overflow-hidden transition-all"
      style={{ boxShadow: isDragOver ? `0 0 0 2px ${color}60` : undefined }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
    >
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-zinc-800">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-sm font-semibold text-zinc-200 flex-1 truncate">{title}</span>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
          {convs.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
        {convs.map((conv) => (
          <Card key={conv.id} conv={conv} onDragStart={() => onDragStart(conv.id)} onDragEnd={onDragEnd}
            onMove={(sid) => onMove(conv.id, sid)} stages={stages} currentStageId={currentStageId} />
        ))}
        {convs.length === 0 && (
          <div className="flex items-center justify-center h-16 text-zinc-700 text-xs">
            {isDragOver ? "Soltar aqui" : "Vazio"}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ conv, onDragStart, onDragEnd, onMove, stages, currentStageId }: {
  conv: typeof mockConversations[0];
  onDragStart: () => void; onDragEnd: () => void;
  onMove: (stageId: string | null) => void;
  stages: typeof mockStages;
  currentStageId: string | null;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const stars = Math.min(Math.floor(conv.leadScore / 20), 5);
  const origin = ORIGIN_CONFIG[conv.origin];

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      className="bg-zinc-800/80 rounded-lg p-3 cursor-grab active:cursor-grabbing border border-zinc-700/50 hover:border-zinc-600 transition-all">
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{conv.name ?? conv.phone}</p>
          {conv.name && <p className="text-xs text-zinc-600 truncate">{conv.phone}</p>}
          {origin && (
            <span className="inline-block text-xs px-1.5 py-0.5 rounded mt-1 font-medium"
              style={{ background: `${origin.color}20`, color: origin.color }}>
              {origin.label}
            </span>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs text-zinc-500"><MessageSquare className="w-3 h-3" />{conv._count.messages}</span>
            {conv._count.pixelFires > 0 && (
              <span className="flex items-center gap-1 text-xs text-violet-400"><Zap className="w-3 h-3" />{conv._count.pixelFires}</span>
            )}
            <div className="flex gap-0.5 ml-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-2.5 h-2.5 ${i < stars ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
              ))}
            </div>
          </div>
          <div className="mt-2 relative">
            <button onClick={() => setShowMenu((v) => !v)} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Mover para estágio ↓
            </button>
            {showMenu && (
              <div className="absolute left-0 top-5 z-10 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-1 min-w-40">
                <button onClick={() => { onMove(null); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 rounded">
                  {!currentStageId && <Check className="w-3 h-3 text-emerald-400" />}
                  <span>Entrada</span>
                </button>
                {stages.map((s) => (
                  <button key={s.id} onClick={() => { onMove(s.id); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 rounded">
                    {currentStageId === s.id && <Check className="w-3 h-3 text-emerald-400" />}
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
