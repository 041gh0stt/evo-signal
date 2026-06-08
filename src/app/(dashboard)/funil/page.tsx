"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  GitBranch, Plus, Trash2, GripVertical,
  Zap, Pencil, Check, X, ArrowUpDown, Key, Info,
} from "lucide-react";

const META_EVENTS = [
  "Lead", "Purchase", "InitiateCheckout", "AddToCart",
  "ViewContent", "Contact", "Schedule", "SubmitApplication",
  "CompleteRegistration", "Subscribe",
];

const EVENT_COLORS: Record<string, string> = {
  Lead: "#3b82f6", Purchase: "#10b981", Schedule: "#8b5cf6",
  Contact: "#f59e0b", InitiateCheckout: "#ec4899", AddToCart: "#06b6d4",
  CompleteRegistration: "#10b981", SubmitApplication: "#f59e0b",
  Subscribe: "#8b5cf6", ViewContent: "#6b7280",
};

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  pixelEventName: string | null;
  triggerKeyword: string | null;
  isSale: boolean;
  isFirstContact: boolean;
  purchaseValue: number | null;
  createdAt: string;
  _count: { conversations: number };
}

interface StageFormData {
  name: string;
  event: string;
  keyword: string;
  isSale: boolean;
  isFirstContact: boolean;
  purchaseValue: string;
}

const emptyForm: StageFormData = {
  name: "", event: "", keyword: "", isSale: false, isFirstContact: false, purchaseValue: "",
};

export default function FunilPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await fetch("/api/funnel/stages").then((r) => r.json());
    setStages(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveStage(f: StageFormData, id?: string) {
    const body = {
      name: f.name.trim(),
      pixelEventName: f.event || null,
      triggerKeyword: f.keyword.trim() || null,
      isSale: f.isSale,
      isFirstContact: f.isFirstContact,
      purchaseValue: f.purchaseValue ? parseFloat(f.purchaseValue) : null,
      color: EVENT_COLORS[f.event] ?? "#6b7280",
    };

    if (id) {
      // Update
      const res = await fetch(`/api/funnel/stages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setStages((s) => s.map((x) => x.id === id ? { ...x, ...data } : x));
        setEditingId(null);
        toast.success("Etapa atualizada!");
      }
    } else {
      // Create
      const res = await fetch("/api/funnel/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setStages((s) => [...s, data]);
        setAdding(false);
        toast.success("Etapa adicionada!");
      }
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/funnel/stages/${id}`, { method: "DELETE" });
    setStages((s) => s.filter((x) => x.id !== id));
    toast.success("Etapa removida");
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    const idx = stages.findIndex((s) => s.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === stages.length - 1) return;
    const newStages = [...stages];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newStages[idx], newStages[swapIdx]] = [newStages[swapIdx], newStages[idx]];
    const updated = newStages.map((s, i) => ({ ...s, order: i }));
    setStages(updated);
    await Promise.all(updated.map((s, i) =>
      fetch(`/api/funnel/stages/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: i }),
      })
    ));
  }

  const shortId = (id: string) => id.slice(-6).toUpperCase();

  if (loading) return <div className="p-6 text-zinc-500 text-sm">Carregando...</div>;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-400" />
            Jornada de Compra
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Configure as etapas, eventos de pixel e termos-chave de cada fase
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOrdering((v) => !v)} variant="outline" size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1.5">
            <ArrowUpDown className="w-4 h-4" />
            {ordering ? "Concluir" : "Ordenar Etapas"}
          </Button>
          <Button onClick={() => { setAdding(true); setEditingId(null); }}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold gap-1.5">
            <Plus className="w-4 h-4" /> Adicionar Nova Etapa
          </Button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <StageForm
          initialData={emptyForm}
          onSave={(f) => saveStage(f)}
          onCancel={() => setAdding(false)}
          title="Nova etapa do funil"
        />
      )}

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-[40px_80px_60px_1fr_1fr_1fr_140px_80px] gap-3 px-4 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <span></span>
          <span>ID</span>
          <span>Ordem</span>
          <span>Nome da Etapa</span>
          <span>Evento de Conversão</span>
          <span>Termo-chave</span>
          <span>Criado em</span>
          <span>Ações</span>
        </div>

        {stages.length === 0 ? (
          <div className="p-10 text-center">
            <GitBranch className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhuma etapa configurada.</p>
            <p className="text-zinc-600 text-xs mt-1">Clique em "Adicionar Nova Etapa" para começar.</p>
          </div>
        ) : (
          stages.map((stage, idx) => {
            const isEditing = editingId === stage.id;
            const eventColor = stage.pixelEventName ? (EVENT_COLORS[stage.pixelEventName] ?? "#6b7280") : null;

            return (
              <div key={stage.id}>
                <div className="grid grid-cols-[40px_80px_60px_1fr_1fr_1fr_140px_80px] gap-3 px-4 py-3.5 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors items-center">
                  <div className="flex flex-col gap-0.5">
                    {ordering ? (
                      <>
                        <button onClick={() => handleReorder(stage.id, "up")} disabled={idx === 0} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 text-xs">▲</button>
                        <button onClick={() => handleReorder(stage.id, "down")} disabled={idx === stages.length - 1} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 text-xs">▼</button>
                      </>
                    ) : (
                      <GripVertical className="w-4 h-4 text-zinc-700" />
                    )}
                  </div>

                  <span className="text-xs text-zinc-600 font-mono">{shortId(stage.id)}</span>
                  <span className="text-sm text-zinc-400 font-medium">{stage.order + 1}</span>

                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
                    <span className="text-sm font-medium text-zinc-100 truncate">{stage.name}</span>
                    {stage.isSale && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs shrink-0">Venda</Badge>}
                    {stage.isFirstContact && <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs shrink-0">1º Contato</Badge>}
                    {stage.purchaseValue && <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs shrink-0">R$ {stage.purchaseValue}</Badge>}
                  </div>

                  <div>
                    {stage.pixelEventName ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-semibold"
                        style={{ background: `${eventColor}20`, color: eventColor ?? undefined }}>
                        <Zap className="w-3 h-3" /> {stage.pixelEventName}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-700">— sem evento</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    {stage.triggerKeyword ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono truncate max-w-full">
                        <Key className="w-3 h-3 shrink-0 text-amber-400" />
                        <span className="truncate">{stage.triggerKeyword}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-700">— sem termo</span>
                    )}
                  </div>

                  <span className="text-xs text-zinc-600">
                    {new Date(stage.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingId(isEditing ? null : stage.id)}
                      className="text-zinc-600 hover:text-zinc-300 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(stage.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="px-4 pb-4 border-b border-zinc-800">
                    <StageForm
                      initialData={{
                        name: stage.name,
                        event: stage.pixelEventName ?? "",
                        keyword: stage.triggerKeyword ?? "",
                        isSale: stage.isSale,
                        isFirstContact: stage.isFirstContact,
                        purchaseValue: stage.purchaseValue?.toString() ?? "",
                      }}
                      onSave={(f) => saveStage(f, stage.id)}
                      onCancel={() => setEditingId(null)}
                      title={`Editar: ${stage.name}`}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>

      <p className="text-xs text-zinc-600">
        💡 Quando o sistema detectar o termo-chave numa mensagem, a conversa avança para essa etapa e o evento de pixel é disparado automaticamente.
      </p>
    </div>
  );
}

// ── Formulário ────────────────────────────────────────────────────────
function StageForm({
  initialData,
  onSave,
  onCancel,
  title,
}: {
  initialData: StageFormData;
  onSave: (f: StageFormData) => void;
  onCancel: () => void;
  title: string;
}) {
  const [f, setF] = useState<StageFormData>(initialData);
  const set = (updates: Partial<StageFormData>) => setF((prev) => ({ ...prev, ...updates }));

  function handleFirstContactToggle(val: boolean) {
    // Etapas de Primeiro Contato são automáticas — não usam termo-chave
    set({ isFirstContact: val, event: val ? "Contact" : f.event, keyword: val ? "" : f.keyword });
  }

  function handleSaleToggle(val: boolean) {
    set({ isSale: val, event: val && !f.event ? "Purchase" : f.event });
  }

  return (
    <Card className="border-zinc-700 p-5 space-y-4 bg-zinc-900 mt-2">
      <p className="text-sm font-semibold text-zinc-300">{title}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Nome da Etapa da Jornada</Label>
          <Input
            autoFocus
            value={f.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Ex: Fez Contato, Agendou, Comprou..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Evento de Conversão Associado</Label>
          <Select value={f.event || "none"} onValueChange={(v) => set({ event: v === "none" ? "" : (v ?? "") })}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectValue placeholder="Selecionar evento..." />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="none" className="text-zinc-400 focus:bg-zinc-800">Nenhum evento</SelectItem>
              {META_EVENTS.map((e) => (
                <SelectItem key={e} value={e} className="text-zinc-100 focus:bg-zinc-800">{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-zinc-600">
            Selecione o evento que será disparado ao Meta quando o lead atingir esta etapa.
          </p>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <Switch checked={f.isFirstContact} onCheckedChange={handleFirstContactToggle}
            className="data-[state=checked]:bg-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-zinc-200">Etapa que representa um primeiro contato?</p>
            <p className="text-xs text-zinc-500 mt-0.5">Define evento automaticamente como <span className="text-blue-400 font-mono">Contact</span>.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <Switch checked={f.isSale} onCheckedChange={handleSaleToggle}
            className="data-[state=checked]:bg-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-zinc-200">Etapa que representa uma venda?</p>
            <p className="text-xs text-zinc-500 mt-0.5">Define evento automaticamente como <span className="text-emerald-400 font-mono">Purchase</span>.</p>
          </div>
        </div>
      </div>

      {/* Purchase value (visible only when isSale) */}
      {f.isSale && (
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Valor da venda (opcional)</Label>
          <div className="relative w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">R$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={f.purchaseValue}
              onChange={(e) => set({ purchaseValue: e.target.value })}
              placeholder="0,00"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 pl-9"
            />
          </div>
          <p className="text-xs text-zinc-600">
            Será enviado como <span className="font-mono">value</span> no evento Purchase para o Meta Pixel.
          </p>
        </div>
      )}

      <Separator className="bg-zinc-800" />

      {/* Keyword — não se aplica à etapa de Primeiro Contato (é automática) */}
      {f.isFirstContact ? (
        <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2.5">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            Etapas de <span className="text-blue-400 font-medium">Primeiro Contato</span> não usam termo-chave —
            o sistema move a conversa pra cá <span className="text-zinc-300">automaticamente</span> assim que
            chega a primeira mensagem de um número que ainda não estava cadastrado, e já dispara o evento{" "}
            <span className="text-blue-400 font-mono">Contact</span> para o Meta Pixel.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            Termo-chave para alterar esta etapa da jornada
          </Label>
          <textarea
            value={f.keyword}
            onChange={(e) => set({ keyword: e.target.value })}
            placeholder="Digite os termos separados por vírgula ou em linhas diferentes.&#10;Ex: agendei, confirmado, quero agendar..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500 resize-none transition-colors"
          />
          <p className="text-xs text-zinc-600">
            Sempre que o sistema identificar esse termo numa mensagem, a conversa será movida para esta etapa e o evento de pixel será disparado.
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button onClick={() => onSave(f)} disabled={!f.name.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold">
          <Check className="w-4 h-4 mr-1.5" /> Salvar
        </Button>
        <Button variant="outline" onClick={onCancel} className="border-zinc-700 text-zinc-400">
          <X className="w-4 h-4 mr-1.5" /> Cancelar
        </Button>
      </div>
    </Card>
  );
}
