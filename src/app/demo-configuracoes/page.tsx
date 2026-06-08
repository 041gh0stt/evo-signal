"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wifi, QrCode, Save, Zap, Link2, Users,
  CheckCircle2, Crown, Crown as CrownIcon,
} from "lucide-react";

const mockWorkspace = { id: "demo", name: "Clínica Bella Forma", whatsappConnected: true, whatsappPhone: "5511994000100", role: "owner" };
const mockAllWorkspaces = [
  mockWorkspace,
  { id: "d2", name: "Studio Fit Academia", whatsappConnected: true, whatsappPhone: "5521991002233", role: "owner" },
];

const mockMembers = [
  { id: "m1", name: "Paulo Pires",      email: "paulo@clinicabella.com.br", role: "owner",  isYou: true },
  { id: "m2", name: "Carla Andrade",    email: "carla@clinicabella.com.br", role: "member", isYou: false },
  { id: "m3", name: "Thiago Mendonça",  email: "thiago@clinicabella.com.br", role: "member", isYou: false },
];

const mockInvites = [
  { id: "i1", email: "novo.atendente@clinicabella.com.br", role: "member", expiresAt: "2025-05-15T10:00:00Z" },
];

export default function DemoConfigPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeWorkspace={mockWorkspace} allWorkspaces={mockAllWorkspaces} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto w-full">

          <div>
            <h1 className="text-xl font-bold text-zinc-100">Configurações</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Gerencie sua conta, integrações e equipe</p>
          </div>

          {/* Nome da conta */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Nome da conta</h2>
            <div className="flex gap-2">
              <Input
                defaultValue="Clínica Bella Forma"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                readOnly
              />
              <Button className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 shrink-0">
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <Separator className="bg-zinc-800" />

          {/* Membros da equipe */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Membros da equipe
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Convide outras pessoas para colaborar neste workspace</p>
            </div>

            <div className="space-y-2">
              {mockMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 bg-zinc-800/40 border border-zinc-800 rounded-lg px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 flex items-center gap-1.5">
                      {m.name}
                      {m.isYou && <span className="text-xs text-zinc-500">(você)</span>}
                      {m.role === "owner" && <CrownIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </p>
                    <p className="text-xs text-zinc-500">{m.email}</p>
                  </div>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-normal shrink-0">
                    {m.role === "owner" ? "Dono" : "Membro"}
                  </Badge>
                </div>
              ))}
            </div>

            {mockInvites.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500">Convites pendentes</p>
                {mockInvites.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 bg-zinc-800/20 border border-dashed border-zinc-800 rounded-lg px-3 py-2">
                    <p className="text-sm text-zinc-400">{i.email}</p>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs font-normal">Pendente</Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <Label className="text-zinc-300 text-xs">Convidar por e-mail</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="pessoa@email.com"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                  readOnly
                />
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold gap-1.5 shrink-0">
                  Convidar
                </Button>
              </div>
            </div>
          </Card>

          <Separator className="bg-zinc-800" />

          {/* WhatsApp */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" /> WhatsApp
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">Instância conectada via Evolution API</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">Conectado</span>
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm text-zinc-200">+55 (11) 9 9400-0100</p>
                <p className="text-xs text-zinc-500">Número ativo · Clínica Bella Forma</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1.5">
                <QrCode className="w-4 h-4" /> Reconectar
              </Button>
            </div>
          </Card>

          <Separator className="bg-zinc-800" />

          {/* Meta Pixel */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" /> Meta Conversions API
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Server-side pixel — mais preciso que o pixel client-side</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Pixel ID</Label>
                <Input defaultValue="934663465656312" readOnly className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Access Token (Conversions API)</Label>
                <Input defaultValue="••••••••••••••••••••" readOnly type="password" className="bg-zinc-800 border-zinc-700 text-zinc-100" />
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Token configurado e ativo
                </p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5">
              <Save className="w-4 h-4" /> Salvar Configurações
            </Button>
          </Card>

          <Separator className="bg-zinc-800" />

          {/* Meta Ads */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-400" /> Meta Ads
            </h2>
            <div className="bg-zinc-800/50 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-sm text-zinc-200">Conta de anúncios conectada</p>
                  <p className="text-xs text-zinc-500">Bella Forma Ads · act_00112233</p>
                </div>
              </div>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">Ativo</Badge>
            </div>
          </Card>

        </main>
      </div>
    </div>
  );
}
