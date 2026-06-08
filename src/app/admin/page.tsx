"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Building2, Wifi, Loader2, Trash2 } from "lucide-react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  workspaceCount: number;
}

interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  whatsappConnected: boolean;
  hasMetaPixel: boolean;
  createdAt: string;
  memberCount: number;
  linkCount: number;
  owner: { name: string | null; email: string | null } | null;
}

interface Stats {
  totals: { users: number; workspaces: number; connected: number };
  users: AdminUser[];
  workspaces: AdminWorkspace[];
}

export default function AdminPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "workspaces">("workspaces");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/stats")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Erro ao carregar dados");
          return;
        }
        setData(json);
      })
      .catch(() => setError("Erro ao carregar dados"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDeleteWorkspace(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/workspaces/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Não foi possível apagar o workspace");
        return;
      }
      toast.success("Workspace apagado");
      setConfirmId(null);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteUser(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Não foi possível apagar o usuário");
        return;
      }
      toast.success("Usuário apagado");
      setConfirmId(null);
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800 p-5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-100">{data.totals.users}</p>
            <p className="text-xs text-zinc-500">Usuários cadastrados</p>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-100">{data.totals.workspaces}</p>
            <p className="text-xs text-zinc-500">Workspaces criados</p>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-100">{data.totals.connected}</p>
            <p className="text-xs text-zinc-500">WhatsApp conectado</p>
          </div>
        </Card>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("workspaces")}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${tab === "workspaces" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Workspaces
        </button>
        <button
          onClick={() => setTab("users")}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${tab === "users" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          Usuários
        </button>
      </div>

      {tab === "workspaces" ? (
        <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                <th className="px-4 py-3 font-medium">Workspace</th>
                <th className="px-4 py-3 font-medium">Dono</th>
                <th className="px-4 py-3 font-medium">Membros</th>
                <th className="px-4 py-3 font-medium">Links</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.workspaces.map((w) => (
                <tr key={w.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-zinc-200">{w.name}</p>
                    <p className="text-xs text-zinc-600">/{w.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {w.owner ? (w.owner.name || w.owner.email) : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{w.memberCount}</td>
                  <td className="px-4 py-3 text-zinc-400">{w.linkCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {w.whatsappConnected && (
                        <Badge variant="outline" className="border-emerald-800 text-emerald-400 text-xs font-normal">WhatsApp</Badge>
                      )}
                      {w.hasMetaPixel && (
                        <Badge variant="outline" className="border-blue-800 text-blue-400 text-xs font-normal">Pixel</Badge>
                      )}
                      {!w.whatsappConnected && !w.hasMetaPixel && (
                        <span className="text-xs text-zinc-700">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{fmtDate(w.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {confirmId === w.id ? (
                      <div className="inline-flex items-center gap-2 bg-red-950/40 border border-red-800/50 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs text-red-300">Apagar tudo?</span>
                        <button
                          onClick={() => handleDeleteWorkspace(w.id)}
                          disabled={busyId === w.id}
                          className="text-xs font-semibold text-red-400 hover:text-red-300"
                        >
                          {busyId === w.id ? "Apagando..." : "Sim"}
                        </button>
                        <span className="text-zinc-700">·</span>
                        <button onClick={() => setConfirmId(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(w.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                        title="Apagar workspace e instância"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Workspaces</th>
                <th className="px-4 py-3 font-medium">Cadastrado em</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3 text-zinc-200">{u.name || "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                  <td className="px-4 py-3 text-zinc-400">{u.workspaceCount}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {confirmId === u.id ? (
                      <div className="inline-flex items-center gap-2 bg-red-950/40 border border-red-800/50 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs text-red-300">Apagar conta?</span>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={busyId === u.id}
                          className="text-xs font-semibold text-red-400 hover:text-red-300"
                        >
                          {busyId === u.id ? "Apagando..." : "Sim"}
                        </button>
                        <span className="text-zinc-700">·</span>
                        <button onClick={() => setConfirmId(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(u.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                        title="Apagar usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
