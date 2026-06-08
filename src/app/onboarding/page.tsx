"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Workspace criado!");
      router.push("/dashboard");
    } else {
      toast.error("Erro ao criar workspace");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <Image src="/pingo-logo.png" alt="Pingo" width={1140} height={441} priority className="h-16 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Crie seu workspace</h1>
          <p className="text-sm text-zinc-500">Normalmente o nome da sua empresa ou cliente</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Nome do workspace</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Beltez Odontologia"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold"
          >
            {loading ? "Criando..." : "Criar Workspace"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
