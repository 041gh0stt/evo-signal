"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users, Wifi, WifiOff, MessageSquare, Zap,
  Plus, ArrowRight, Check, Search, Trash2, AlertTriangle,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  whatsappConnected: boolean;
  whatsappPhone: string | null;
  role: string;
  convCount: number;
  pixelCount: number;
}

interface Props {
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

export function ClientesClient({ workspaces, activeWorkspaceId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = workspaces.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSwitch(workspaceId: string) {
    await fetch("/api/workspace/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    const res = await fetch("/api/workspace/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      toast.success(`Conta "${newName}" criada!`);
      setNewName("");
      setCreating(false);
      startTransition(() => router.refresh());
    } else {
      toast.error("Erro ao criar conta");
    }
  }

  async function handleDelete(workspaceId: string) {
    setDeleting(true);
    const res = await fetch("/api/workspace/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    setDeleting(false);
    setConfirmDeleteId(null);
    if (res.ok) {
      toast.success("Conta apagada");
      startTransition(() => router.refresh());
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Erro ao apagar conta");
    }
  }

  const connected = workspaces.filter((w) => w.whatsappConnected).length;
  const disconnected = workspaces.length - connected;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Gerenciar Contas
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {workspaces.length} conta(s) · {connected} conectada(s)
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold gap-2"
        >
          <Plus className="w-4 h-4" /> Adicionar conta
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-zinc-100">{workspaces.length}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Contas cadastradas</div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-emerald-400">{connected}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <Wifi className="w-3 h-3" /> WhatsApp conectado
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-red-400">{disconnected}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <WifiOff className="w-3 h-3" /> Desconectado
          </div>
        </Card>
      </div>

      {/* Add account inline form */}
      {creating && (
        <Card className="bg-zinc-900/50 border-emerald-500/30 border p-4">
          <p className="text-sm font-semibold text-zinc-300 mb-3">Nova conta de cliente</p>
          <div className="flex gap-3">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
              placeholder="Nome do cliente (ex: Clínica ABC)"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
            <Button onClick={handleCreate} disabled={!newName.trim()} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold shrink-0">
              Criar
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)} className="border-zinc-700 text-zinc-400 shrink-0">
              Cancelar
            </Button>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Após criar, você poderá configurar o WhatsApp e o pixel de cada conta individualmente.
          </p>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar conta..."
          className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 pl-9"
        />
      </div>

      {/* Accounts table */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <span>Conta</span>
          <span>WhatsApp</span>
          <span>Conversas</span>
          <span>Eventos Pixel</span>
          <span></span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-zinc-600 text-sm">
            {search ? "Nenhuma conta encontrada" : "Nenhuma conta cadastrada ainda"}
          </div>
        ) : (
          filtered.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            const initials = ws.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

            return (
              <div
                key={ws.id}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3.5 items-center border-b border-zinc-800/50 last:border-0 transition-colors ${
                  isActive ? "bg-emerald-500/5" : "hover:bg-zinc-800/30"
                }`}
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100 truncate">{ws.name}</span>
                      {isActive && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs gap-1 shrink-0">
                          <Check className="w-2.5 h-2.5" /> Ativa
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-zinc-600">{ws.role === "owner" ? "Proprietário" : "Membro"}</span>
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  {ws.whatsappConnected ? (
                    <div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-xs">
                        <Wifi className="w-3 h-3" /> Conectado
                      </Badge>
                      {ws.whatsappPhone && (
                        <p className="text-xs text-zinc-600 mt-1">{ws.whatsappPhone}</p>
                      )}
                    </div>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1 text-xs">
                      <WifiOff className="w-3 h-3" /> Desconectado
                    </Badge>
                  )}
                </div>

                {/* Conversations */}
                <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
                  {ws.convCount}
                </div>

                {/* Pixel fires */}
                <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                  <Zap className="w-3.5 h-3.5 text-violet-500" />
                  {ws.pixelCount}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {confirmDeleteId === ws.id ? (
                    // Confirmação inline
                    <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="text-xs text-red-300">Apagar tudo?</span>
                      <button
                        onClick={() => handleDelete(ws.id)}
                        disabled={deleting}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                      >
                        {deleting ? "Apagando..." : "Sim"}
                      </button>
                      <span className="text-zinc-700">·</span>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      {isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 text-zinc-400 text-xs gap-1.5"
                          onClick={() => router.push("/settings")}
                        >
                          <Users className="w-3.5 h-3.5" /> Configurar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isPending}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs gap-1.5 border border-zinc-700"
                          onClick={() => handleSwitch(ws.id)}
                        >
                          Acessar <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(ws.id)}
                        className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Apagar conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
