"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, UserPlus, Copy, Trash2, X, Loader2, Crown } from "lucide-react";

interface Member {
  id: string;
  role: string;
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isYou: boolean;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

export function TeamMembersCard() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/invite");
      const data = await res.json();
      if (res.ok) {
        setRole(data.role);
        setMembers(data.members ?? []);
        setInvites(data.invites ?? []);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível enviar o convite");
        return;
      }
      toast.success("Convite enviado!");
      setEmail("");
      setInviteRole("member");
      await load();
    } catch {
      toast.error("Algo deu errado. Tente novamente.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/workspace/invite/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Não foi possível revogar o convite");
        return;
      }
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success("Convite revogado");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveMember(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/workspace/members/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível remover o membro");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success("Membro removido");
    } finally {
      setBusyId(null);
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link do convite copiado!");
  }

  const isOwner = role === "owner";

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Membros da equipe
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">Convide outras pessoas para colaborar neste workspace</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 bg-zinc-800/40 border border-zinc-800 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate flex items-center gap-1.5">
                    {m.name || m.email}
                    {m.isYou && <span className="text-xs text-zinc-500">(você)</span>}
                    {m.role === "owner" && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-normal">
                    {m.role === "owner" ? "Dono" : "Membro"}
                  </Badge>
                  {isOwner && !m.isYou && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={busyId === m.id}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                      title="Remover membro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {invites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">Convites pendentes</p>
              {invites.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-3 bg-zinc-800/20 border border-dashed border-zinc-800 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-300 truncate">{i.email}</p>
                    <p className="text-xs text-zinc-600">
                      {i.role === "owner" ? "Dono" : "Membro"} · expira em {new Date(i.expiresAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyInviteLink(i.token)}
                      className="text-zinc-500 hover:text-emerald-400 transition-colors"
                      title="Copiar link do convite"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => handleRevoke(i.id)}
                        disabled={busyId === i.id}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                        title="Revogar convite"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isOwner && (
            <form onSubmit={handleInvite} className="space-y-2 pt-1">
              <Label className="text-zinc-300 text-xs">Convidar por e-mail</Label>
              <div className="flex gap-2">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="pessoa@email.com"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="member">Membro</option>
                  <option value="owner">Dono</option>
                </select>
                <Button type="submit" disabled={inviting || !email.trim()} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold gap-1.5 shrink-0">
                  <UserPlus className="w-4 h-4" />
                  {inviting ? "Enviando..." : "Convidar"}
                </Button>
              </div>
              <p className="text-xs text-zinc-600">A pessoa receberá um e-mail com um link para entrar no workspace.</p>
            </form>
          )}
        </>
      )}
    </Card>
  );
}
