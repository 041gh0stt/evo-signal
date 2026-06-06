"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });

    if (!res.ok) {
      setLoading(false);
      toast.error("Erro ao criar conta. Email já em uso?");
      return;
    }

    await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });

    router.push("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Radio className="w-5 h-5 text-zinc-900" />
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-100">
            EVO <span className="text-emerald-400">SIGNAL</span>
          </span>
        </div>
        <h1 className="text-xl font-bold text-zinc-100">Criar conta</h1>
        <p className="text-sm text-zinc-500">Comece a rastrear suas conversas hoje</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-zinc-300 text-sm">Nome</Label>
            <Input id="name" name="name" required placeholder="Seu nome" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="seu@email.com" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-zinc-300 text-sm">Senha</Label>
            <Input id="password" name="password" type="password" required minLength={8} placeholder="Mínimo 8 caracteres" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold">
            {loading ? "Criando conta..." : "Criar Conta"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-zinc-600">
        Já tem conta?{" "}
        <a href="/login" className="text-emerald-400 hover:underline">Entrar</a>
      </p>
    </div>
  );
}
