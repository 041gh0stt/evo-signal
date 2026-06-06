"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, Wifi, WifiOff, Plus, Settings2, Check, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  whatsappConnected: boolean;
  whatsappPhone: string | null;
  role: string;
}

interface HeaderProps {
  activeWorkspace: Workspace;
  allWorkspaces: Workspace[];
}

export function Header({ activeWorkspace, allWorkspaces }: HeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSwitch(workspaceId: string) {
    if (workspaceId === activeWorkspace.id) { setOpen(false); return; }
    setOpen(false);
    await fetch("/api/workspace/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    window.location.reload();
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
      setOpen(false);
      startTransition(() => router.refresh());
    } else {
      toast.error("Erro ao criar conta");
    }
  }

  const initials = activeWorkspace.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-end px-6 shrink-0 relative z-20">
      {/* Workspace switcher */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
        >
          {/* Status dot */}
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              activeWorkspace.whatsappConnected ? "bg-emerald-400" : "bg-red-400"
            }`}
          />

          {/* Avatar */}
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
            {initials}
          </div>

          <div className="text-left">
            <p className="text-sm font-semibold text-zinc-100 leading-none">{activeWorkspace.name}</p>
            <p className="text-xs text-zinc-500 leading-none mt-0.5">
              {activeWorkspace.whatsappConnected
                ? `Conectado${activeWorkspace.whatsappPhone ? ` · ${activeWorkspace.whatsappPhone}` : ""}`
                : "WhatsApp desconectado"}
            </p>
          </div>

          {isPending ? (
            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
          ) : (
            <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-12 z-20 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-3 py-2.5 border-b border-zinc-800">
                <p className="text-xs text-zinc-500 font-medium">Trocar de conta</p>
              </div>

              {/* Workspace list */}
              <div className="max-h-56 overflow-y-auto">
                {allWorkspaces.map((ws) => {
                  const wsInitials = ws.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleSwitch(ws.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                        {wsInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{ws.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {ws.whatsappConnected ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <Wifi className="w-3 h-3" /> Conectado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-zinc-600">
                              <WifiOff className="w-3 h-3" /> Desconectado
                            </span>
                          )}
                        </div>
                      </div>
                      {ws.id === activeWorkspace.id && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="border-t border-zinc-800 p-2 space-y-1">
                {creating ? (
                  <div className="flex gap-2 p-1">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
                      placeholder="Nome do cliente..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleCreate}
                      className="px-3 py-1.5 bg-emerald-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors"
                    >
                      Criar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreating(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Nova conta
                  </button>
                )}
                <button
                  onClick={() => { setOpen(false); router.push("/clientes"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <Settings2 className="w-4 h-4" /> Gerenciar contas
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
