export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Zap, Plus, Trash2 } from "lucide-react";

const META_EVENTS = [
  "Lead", "Purchase", "InitiateCheckout", "AddToCart", "ViewContent",
  "Contact", "Schedule", "SubmitApplication", "CompleteRegistration",
];

interface EventConfig {
  id: string;
  name: string;
  eventName: string;
  triggerType: string;
  triggerValue: string | null;
  direction: string;
  active: boolean;
}

export default function PixelEventsPage() {
  const [events, setEvents] = useState<EventConfig[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    eventName: "Lead",
    triggerType: "keyword",
    triggerValue: "",
    direction: "inbound",
  });

  useEffect(() => {
    fetch("/api/pixel-events").then((r) => r.json()).then(setEvents);
  }, []);

  async function handleCreate() {
    setCreating(true);
    const res = await fetch("/api/pixel-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      setEvents((e) => [...e, data]);
      setForm({ name: "", eventName: "Lead", triggerType: "keyword", triggerValue: "", direction: "inbound" });
      toast.success("Evento criado!");
    } else {
      toast.error("Erro ao criar evento");
    }
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/pixel-events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setEvents((e) => e.map((ev) => ev.id === id ? { ...ev, active } : ev));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/pixel-events/${id}`, { method: "DELETE" });
    setEvents((e) => e.filter((ev) => ev.id !== id));
    toast.success("Evento removido");
  }

  const triggerLabel: Record<string, string> = {
    keyword: "Palavra-chave",
    first_message: "Primeira mensagem",
  };

  const directionLabel: Record<string, string> = {
    inbound: "Recebida",
    outbound: "Enviada",
    both: "Ambas",
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          Eventos de Pixel
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Configure gatilhos para disparar eventos ao Meta Pixel</p>
      </div>

      {/* Create form */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300">Novo Evento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Nome do gatilho</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Lead qualificado"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Evento Meta</Label>
            <Select value={form.eventName} onValueChange={(v) => setForm((f) => ({ ...f, eventName: v ?? f.eventName }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {META_EVENTS.map((e) => (
                  <SelectItem key={e} value={e} className="text-zinc-100 focus:bg-zinc-800">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Tipo de gatilho</Label>
            <Select value={form.triggerType} onValueChange={(v) => setForm((f) => ({ ...f, triggerType: v ?? f.triggerType }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="keyword" className="text-zinc-100 focus:bg-zinc-800">Palavra-chave</SelectItem>
                <SelectItem value="first_message" className="text-zinc-100 focus:bg-zinc-800">Primeira mensagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.triggerType === "keyword" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Palavra-chave</Label>
              <Input
                value={form.triggerValue}
                onChange={(e) => setForm((f) => ({ ...f, triggerValue: e.target.value }))}
                placeholder="Ex: agendei, comprei, quero..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Direção da mensagem</Label>
            <Select value={form.direction} onValueChange={(v) => setForm((f) => ({ ...f, direction: v ?? f.direction }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="inbound" className="text-zinc-100 focus:bg-zinc-800">Mensagem recebida</SelectItem>
                <SelectItem value="outbound" className="text-zinc-100 focus:bg-zinc-800">Mensagem enviada</SelectItem>
                <SelectItem value="both" className="text-zinc-100 focus:bg-zinc-800">Ambas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleCreate} disabled={creating || !form.name} className="bg-violet-600 hover:bg-violet-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {creating ? "Criando..." : "Criar Evento"}
        </Button>
      </Card>

      {/* Events list */}
      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm">Nenhum evento configurado ainda</div>
        ) : (
          events.map((ev) => (
            <Card key={ev.id} className="bg-zinc-900/50 border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-200">{ev.name}</span>
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs">{ev.eventName}</Badge>
                    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{triggerLabel[ev.triggerType]}</Badge>
                    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{directionLabel[ev.direction]}</Badge>
                  </div>
                  {ev.triggerValue && (
                    <p className="text-xs text-zinc-500 mt-1">Palavra-chave: <span className="text-zinc-300 font-mono">{ev.triggerValue}</span></p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={ev.active}
                    onCheckedChange={(v) => handleToggle(ev.id, v)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <button onClick={() => handleDelete(ev.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
