"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");

    if (password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível redefinir sua senha");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      toast.error("Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <Image src="/pingo-logo.png" alt="Pingo" width={1140} height={441} priority className="h-16 w-auto" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100">Criar nova senha</h1>
        <p className="text-sm text-zinc-500">Escolha uma nova senha para sua conta</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        {done ? (
          <div className="text-center space-y-3 py-2">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm text-zinc-300">
              Senha redefinida com sucesso! Te levando para o login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-300 text-sm">Nova senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-zinc-300 text-sm">Confirmar nova senha</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold"
            >
              {loading ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
