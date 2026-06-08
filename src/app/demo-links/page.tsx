"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Link2, Copy, MousePointerClick, MessageSquare,
  ExternalLink, Users, ChevronDown, ChevronUp, Megaphone, Plus,
} from "lucide-react";

const mockWorkspace = { id: "demo", name: "Clínica Bella Forma", whatsappConnected: true, whatsappPhone: "5511994000100", role: "owner" };
const mockAllWorkspaces = [
  mockWorkspace,
  { id: "d2", name: "Studio Fit Academia", whatsappConnected: true, whatsappPhone: "5521991002233", role: "owner" },
  { id: "d3", name: "Imobiliária Prime", whatsappConnected: true, whatsappPhone: "5531988550044", role: "owner" },
];

const BASE = "https://pingotracker.vercel.app";

const mockLinks = [
  {
    id: "l1",
    name: "Campanha Botox — Maio",
    slug: "botox-maio",
    utmSource: "instagram",
    utmMedium: "cpc",
    utmCampaign: "botox-maio-2025",
    utmContent: "video-antes-depois",
    welcomeMessage: "Oi! Vi o anúncio do botox no Instagram 💉",
    clicks: 312,
    createdAt: "2025-05-01T10:00:00Z",
    conversations: [
      { id: "c1", phone: "(11) 99481-2043", name: "Beatriz Almeida",  lastMessageAt: "2025-05-08T09:58:00Z", funnelStage: { name: "Em Negociação", color: "#8b5cf6" }, _count: { messages: 18 } },
      { id: "c2", phone: "(21) 98765-4321", name: "Rafael Torres",    lastMessageAt: "2025-05-08T09:49:00Z", funnelStage: { name: "Proposta Enviada", color: "#f59e0b" }, _count: { messages: 9 } },
      { id: "c3", phone: "(31) 99642-0187", name: "Camila Ferreira",  lastMessageAt: "2025-05-08T09:26:00Z", funnelStage: { name: "Fechado ✓", color: "#10b981" }, _count: { messages: 31 } },
      { id: "c4", phone: "(11) 99203-8471", name: "Mariana Gomes",    lastMessageAt: "2025-05-07T22:00:00Z", funnelStage: { name: "Em Negociação", color: "#8b5cf6" }, _count: { messages: 14 } },
    ],
  },
  {
    id: "l2",
    name: "Google Ads — Harmonização",
    slug: "harmonizacao-google",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "harmonizacao-facial-sp",
    utmContent: null,
    welcomeMessage: "Olá! Vi o anúncio de harmonização facial no Google 😊",
    clicks: 187,
    createdAt: "2025-04-15T08:30:00Z",
    conversations: [
      { id: "c5", phone: "(11) 99384-7210", name: "Fernanda Costa",   lastMessageAt: "2025-05-08T08:00:00Z", funnelStage: { name: "Fechado ✓", color: "#10b981" }, _count: { messages: 22 } },
      { id: "c6", phone: "(19) 99812-3456", name: "André Nascimento", lastMessageAt: "2025-05-08T07:50:00Z", funnelStage: null, _count: { messages: 7 } },
    ],
  },
  {
    id: "l3",
    name: "Bio Instagram (orgânico)",
    slug: "bio-ig",
    utmSource: "instagram",
    utmMedium: "organic",
    utmCampaign: null,
    utmContent: null,
    welcomeMessage: "Oi! Vim pelo Instagram de vocês 😍",
    clicks: 94,
    createdAt: "2025-03-10T14:00:00Z",
    conversations: [
      { id: "c7", phone: "(41) 98873-1290", name: null,               lastMessageAt: "2025-05-07T18:00:00Z", funnelStage: { name: "Novo Lead", color: "#3b82f6" }, _count: { messages: 4 } },
      { id: "c8", phone: "(21) 99600-1122", name: "Diego Carvalho",   lastMessageAt: "2025-05-06T12:00:00Z", funnelStage: { name: "Novo Lead", color: "#3b82f6" }, _count: { messages: 5 } },
    ],
  },
];

export default function DemoLinksPage() {
  const [expanded, setExpanded] = useState<string | null>("l1");

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeWorkspace={mockWorkspace} allWorkspaces={mockAllWorkspaces} />
        <main className="flex-1 overflow-y-auto p-6 space-y-5 max-w-5xl mx-auto w-full">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-400" /> Links Rastreáveis
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">Saiba exatamente qual anúncio gerou cada conversa no WhatsApp</p>
            </div>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold gap-2">
              <Plus className="w-4 h-4" /> Novo Link
            </Button>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Links ativos", value: mockLinks.length, icon: <Link2 className="w-4 h-4" />, color: "text-emerald-400" },
              { label: "Total de cliques", value: mockLinks.reduce((s, l) => s + l.clicks, 0), icon: <MousePointerClick className="w-4 h-4" />, color: "text-blue-400" },
              { label: "Conversas geradas", value: mockLinks.reduce((s, l) => s + l.conversations.length, 0), icon: <Users className="w-4 h-4" />, color: "text-violet-400" },
            ].map((k) => (
              <Card key={k.label} className="bg-zinc-900/50 border-zinc-800 p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-zinc-800 ${k.color}`}>{k.icon}</div>
                <div>
                  <p className="text-xl font-bold text-zinc-100">{k.value}</p>
                  <p className="text-xs text-zinc-500">{k.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Links list */}
          <div className="space-y-3">
            {mockLinks.map((link) => {
              const isOpen = expanded === link.id;
              return (
                <Card key={link.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                  {/* Link header */}
                  <div className="p-4 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-zinc-100">{link.name}</p>
                        {link.utmSource && (
                          <Badge variant="outline" className="border-blue-800 text-blue-400 text-xs font-normal gap-1">
                            <Megaphone className="w-3 h-3" />{link.utmSource}
                          </Badge>
                        )}
                        {link.utmMedium && (
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-normal">{link.utmMedium}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <code className="text-xs text-zinc-500 font-mono">{BASE}/r/{link.slug}</code>
                        <button className="text-zinc-600 hover:text-emerald-400 transition-colors" title="Copiar link">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a href="#" className="text-zinc-600 hover:text-zinc-400 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      {link.welcomeMessage && (
                        <p className="text-xs text-zinc-600 mt-1 truncate flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 shrink-0" /> {link.welcomeMessage}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-5 shrink-0 text-center">
                      <div>
                        <p className="text-lg font-bold text-zinc-100">{link.clicks}</p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1"><MousePointerClick className="w-3 h-3" />cliques</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-zinc-100">{link.conversations.length}</p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1"><Users className="w-3 h-3" />conversas</p>
                      </div>
                      <button
                        onClick={() => setExpanded(isOpen ? null : link.id)}
                        className="text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Conversations expandable */}
                  {isOpen && link.conversations.length > 0 && (
                    <div className="border-t border-zinc-800">
                      <div className="px-4 py-2 bg-zinc-800/30">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Conversas geradas por este link</p>
                      </div>
                      <div className="divide-y divide-zinc-800/50">
                        {link.conversations.map((conv) => (
                          <div key={conv.id} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/20 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300 shrink-0">
                              {(conv.name ?? conv.phone).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-zinc-200 font-medium truncate">{conv.name ?? conv.phone}</p>
                              {conv.name && <p className="text-xs text-zinc-600 truncate">{conv.phone}</p>}
                            </div>
                            {conv.funnelStage && (
                              <span className="flex items-center gap-1.5 text-xs font-medium shrink-0" style={{ color: conv.funnelStage.color }}>
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: conv.funnelStage.color }} />
                                {conv.funnelStage.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
                              <MessageSquare className="w-3 h-3" />{conv._count.messages}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
