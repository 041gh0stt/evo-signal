"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email") }),
      });
      setSent(true);
    } catch {
      toast.error("Não foi possível processar sua solicitação. Tente novamente.");
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
        <h1 className="text-xl font-bold text-zinc-100">Esqueci minha senha</h1>
        <p className="text-sm text-zinc-500">Informe seu e-mail e enviaremos um link para redefinir sua senha</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        {sent ? (
          <div className="text-center space-y-3 py-2">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <p className="text-sm text-zinc-300">
              Se houver uma conta com esse e-mail, enviamos um link de redefinição de senha. Confira sua caixa de entrada (e o spam).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold"
            >
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
        )}
      </Card>

      <p className="text-center text-sm text-zinc-600">
        Lembrou a senha?{" "}
        <a href="/login" className="text-emerald-400 hover:underline">Voltar para o login</a>
      </p>
    </div>
  );
}
