"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Email ou senha inválidos");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <Image src="/pingo-logo.png" alt="Pingo" width={1140} height={441} priority className="h-12 w-auto" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100">Entrar na sua conta</h1>
        <p className="text-sm text-zinc-500">Rastreamento de WhatsApp + Meta Pixel</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
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
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-zinc-300 text-sm">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-zinc-600">
        Não tem conta?{" "}
        <a href="/register" className="text-emerald-400 hover:underline">Criar conta</a>
      </p>
    </div>
  );
}
