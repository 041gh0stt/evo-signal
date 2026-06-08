"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Users, Loader2 } from "lucide-react";

type InviteInfo = {
  workspaceName: string;
  email: string;
  role: string;
  expiresAt: string;
};

export default function ConvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/workspace/invite/info?token=${encodeURIComponent(params.token)}`).then((r) =>
        r.json().then((data) => ({ ok: r.ok, data }))
      ),
      fetch("/api/auth/session").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([inviteRes, sessionData]) => {
        if (cancelled) return;
        if (!inviteRes.ok) {
          setError(inviteRes.data?.error ?? "Não foi possível carregar este convite");
        } else {
          setInvite(inviteRes.data);
        }
        setLoggedIn(!!sessionData?.user);
      })
      .catch(() => !cancelled && setError("Não foi possível carregar este convite"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch("/api/workspace/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível aceitar o convite");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      toast.error("Algo deu errado. Tente novamente.");
    } finally {
      setAccepting(false);
    }
  }

  const redirectParam = encodeURIComponent(`/convite/${params.token}`);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <Image src="/pingo-logo.png" alt="Pingo" width={1140} height={441} priority className="h-16 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Convite para workspace</h1>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center space-y-3 py-2">
              <p className="text-sm text-red-400">{error}</p>
              <Link href="/login" className="text-sm text-emerald-400 hover:underline">
                Ir para o login
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-3 py-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm text-zinc-300">Convite aceito! Te levando para o painel...</p>
            </div>
          ) : invite ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-zinc-300">
                    Você foi convidado para entrar no workspace
                  </p>
                  <p className="text-base font-semibold text-zinc-100">{invite.workspaceName}</p>
                  <p className="text-xs text-zinc-500">
                    Convite enviado para <span className="text-zinc-400">{invite.email}</span> · papel{" "}
                    <span className="text-zinc-400">{invite.role === "owner" ? "dono" : "membro"}</span>
                  </p>
                </div>
              </div>

              {!loggedIn ? (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500">
                    Você precisa entrar ou criar uma conta com o e-mail <span className="text-zinc-400">{invite.email}</span> para aceitar este convite.
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/login?redirect=${redirectParam}`} className="flex-1">
                      <Button variant="outline" className="w-full border-zinc-700 text-zinc-200 hover:bg-zinc-800">
                        Entrar
                      </Button>
                    </Link>
                    <Link href={`/register?redirect=${redirectParam}`} className="flex-1">
                      <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold">
                        Criar conta
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold"
                >
                  {accepting ? "Aceitando..." : "Aceitar convite"}
                </Button>
              )}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
