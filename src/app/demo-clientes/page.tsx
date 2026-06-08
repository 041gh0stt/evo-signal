"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Wifi, WifiOff, MessageSquare, Zap, Plus, ArrowRight, Search, Check } from "lucide-react";

const mockActive = { id: "demo", name: "Clínica Bella Forma", whatsappConnected: true, whatsappPhone: "5511994000100", role: "owner" };
const mockAllWorkspaces = [
  mockActive,
  { id: "d2", name: "Studio Fit Academia", whatsappConnected: true, whatsappPhone: "5521991002233", role: "owner" },
];

const mockWorkspaces = [
  { id: "demo", name: "Clínica Bella Forma",     whatsappConnected: true,  whatsappPhone: "5511994000100", role: "owner",  convCount: 348, pixelCount: 187 },
  { id: "d2",   name: "Studio Fit Academia",     whatsappConnected: true,  whatsappPhone: "5521991002233", role: "owner",  convCount: 214, pixelCount: 103 },
  { id: "d3",   name: "Imobiliária Prime",       whatsappConnected: true,  whatsappPhone: "5531988550044", role: "owner",  convCount: 127, pixelCount:  58 },
  { id: "d4",   name: "Advocacia & Associados",  whatsappConnected: false, whatsappPhone: null,            role: "owner",  convCount:   0, pixelCount:   0 },
  { id: "d5",   name: "Loja Virtual Moda Zen",   whatsappConnected: true,  whatsappPhone: "5541977003344", role: "owner",  convCount:  89, pixelCount:  41 },
];

export default function DemoClientesPage() {
  const [search, setSearch] = useState("");
  const activeId = "demo";

  const filtered = mockWorkspaces.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const connected    = mockWorkspaces.filter((w) => w.whatsappConnected).length;
  const disconnected = mockWorkspaces.length - connected;
  const totalConvs   = mockWorkspaces.reduce((s, w) => s + w.convCount, 0);
  const totalPixels  = mockWorkspaces.reduce((s, w) => s + w.pixelCount, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeWorkspace={mockActive} allWorkspaces={mockAllWorkspaces} />
        <main className="flex-1 overflow-y-auto p-6 space-y-5 max-w-4xl mx-auto w-full">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Clientes / Workspaces
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">Gerencie todas as contas em um só lugar</p>
            </div>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold gap-2">
              <Plus className="w-4 h-4" /> Nova Conta
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Contas ativas", value: mockWorkspaces.length, color: "text-zinc-100" },
              { label: "WhatsApp conectado", value: connected, color: "text-emerald-400" },
              { label: "Total de conversas", value: totalConvs.toLocaleString("pt-BR"), color: "text-blue-400" },
              { label: "Eventos pixel", value: totalPixels.toLocaleString("pt-BR"), color: "text-violet-400" },
            ].map((k) => (
              <Card key={k.label} className="bg-zinc-900/50 border-zinc-800 p-4 space-y-1">
                <p className="text-xs text-zinc-500">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </Card>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conta..."
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 pl-9"
            />
          </div>

          {/* Workspaces grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((ws) => {
              const isActive = ws.id === activeId;
              return (
                <Card
                  key={ws.id}
                  className={`bg-zinc-900/50 border-zinc-800 p-5 flex flex-col gap-4 transition-all ${isActive ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "hover:border-zinc-700"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-100 truncate">{ws.name}</p>
                        {isActive && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-medium shrink-0">
                            <Check className="w-3 h-3 mr-1" /> Ativa
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {ws.whatsappConnected ? (
                          <>
                            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs text-emerald-400">Conectado · {ws.whatsappPhone}</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3.5 h-3.5 text-zinc-600" />
                            <span className="text-xs text-zinc-600">Sem WhatsApp</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-semibold text-zinc-200">{ws.convCount.toLocaleString("pt-BR")}</span>
                      <span className="text-xs text-zinc-600">conversas</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Zap className="w-3.5 h-3.5 text-violet-400" />
                      <span className="font-semibold text-zinc-200">{ws.pixelCount.toLocaleString("pt-BR")}</span>
                      <span className="text-xs text-zinc-600">pixels</span>
                    </div>
                  </div>

                  {!isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1.5"
                    >
                      Acessar conta <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </Card>
              );
            })}

            {/* Add new */}
            <button className="h-full min-h-[140px] rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all p-5">
              <Plus className="w-6 h-6" />
              <span className="text-sm">Adicionar nova conta</span>
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}
