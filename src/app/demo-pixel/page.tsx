"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle, XCircle, TrendingUp, ShoppingCart, Calendar, UserPlus } from "lucide-react";

const mockWorkspace = { id: "demo", name: "Clínica Bella Forma", whatsappConnected: true, whatsappPhone: "5511994000100", role: "owner" };
const mockAllWorkspaces = [
  mockWorkspace,
  { id: "d2", name: "Studio Fit Academia", whatsappConnected: true, whatsappPhone: "5521991002233", role: "owner" },
];

const now = new Date();
const m = (n: number) => new Date(now.getTime() - n * 60 * 1000);
const h = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000);

const EVENT_COLORS: Record<string, string> = {
  Lead:             "#3b82f6",
  Purchase:         "#10b981",
  Schedule:         "#8b5cf6",
  InitiateCheckout: "#ec4899",
  Contact:          "#f59e0b",
  AddToCart:        "#06b6d4",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  Lead:             <UserPlus className="w-3.5 h-3.5" />,
  Purchase:         <ShoppingCart className="w-3.5 h-3.5" />,
  Schedule:         <Calendar className="w-3.5 h-3.5" />,
  InitiateCheckout: <TrendingUp className="w-3.5 h-3.5" />,
};

const mockFires = [
  { id: "f1",  conversation: { phone: "(11) 99481-2043", name: "Beatriz Almeida"  }, eventName: "Lead",             success: true,  firedAt: m(2),   errorMessage: null },
  { id: "f2",  conversation: { phone: "(11) 99481-2043", name: "Beatriz Almeida"  }, eventName: "InitiateCheckout", success: true,  firedAt: m(4),   errorMessage: null },
  { id: "f3",  conversation: { phone: "(11) 99384-7210", name: "Fernanda Costa"   }, eventName: "Purchase",         success: true,  firedAt: m(18),  errorMessage: null },
  { id: "f4",  conversation: { phone: "(11) 99384-7210", name: "Fernanda Costa"   }, eventName: "Schedule",         success: true,  firedAt: m(22),  errorMessage: null },
  { id: "f5",  conversation: { phone: "(11) 99384-7210", name: "Fernanda Costa"   }, eventName: "Lead",             success: true,  firedAt: m(35),  errorMessage: null },
  { id: "f6",  conversation: { phone: "(21) 98765-4321", name: "Rafael Torres"    }, eventName: "Schedule",         success: true,  firedAt: m(51),  errorMessage: null },
  { id: "f7",  conversation: { phone: "(21) 98765-4321", name: "Rafael Torres"    }, eventName: "Lead",             success: true,  firedAt: m(58),  errorMessage: null },
  { id: "f8",  conversation: { phone: "(31) 99642-0187", name: "Camila Ferreira"  }, eventName: "Purchase",         success: true,  firedAt: h(1),   errorMessage: null },
  { id: "f9",  conversation: { phone: "(19) 99203-8471", name: "Mariana Gomes"    }, eventName: "Lead",             success: true,  firedAt: h(2),   errorMessage: null },
  { id: "f10", conversation: { phone: "(41) 98873-1290", name: null               }, eventName: "Lead",             success: false, firedAt: h(2),   errorMessage: "Invalid pixel token" },
  { id: "f11", conversation: { phone: "(11) 99812-3456", name: "André Nascimento" }, eventName: "InitiateCheckout", success: true,  firedAt: h(3),   errorMessage: null },
  { id: "f12", conversation: { phone: "(11) 99812-3456", name: "André Nascimento" }, eventName: "Lead",             success: true,  firedAt: h(3),   errorMessage: null },
  { id: "f13", conversation: { phone: "(21) 99600-1122", name: "Diego Carvalho"   }, eventName: "Schedule",         success: false, firedAt: h(5),   errorMessage: "Duplicate event blocked" },
  { id: "f14", conversation: { phone: "(31) 99642-0187", name: "Camila Ferreira"  }, eventName: "Lead",             success: true,  firedAt: h(6),   errorMessage: null },
  { id: "f15", conversation: { phone: "(11) 99481-2043", name: "Beatriz Almeida"  }, eventName: "Schedule",         success: true,  firedAt: h(7),   errorMessage: null },
];

const totalSuccess = mockFires.filter((f) => f.success).length;
const totalFail    = mockFires.filter((f) => !f.success).length;

const byEvent = Object.entries(
  mockFires.filter((f) => f.success).reduce((acc, f) => {
    acc[f.eventName] = (acc[f.eventName] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).sort((a, b) => b[1] - a[1]);

function fmtTime(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff}min atrás`;
  return `${Math.floor(diff / 60)}h atrás`;
}

export default function DemoPixelPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeWorkspace={mockWorkspace} allWorkspaces={mockAllWorkspaces} />
        <main className="flex-1 overflow-y-auto p-6 space-y-5 max-w-5xl mx-auto w-full">

          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-400" /> Registro de Eventos Pixel
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">Eventos enviados para a Meta Conversions API em tempo real</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-zinc-900/50 border-zinc-800 p-4 space-y-1">
              <p className="text-xs text-zinc-500">Total disparado</p>
              <p className="text-2xl font-bold text-zinc-100">{mockFires.length}</p>
            </Card>
            <Card className="bg-zinc-900/50 border-emerald-900/40 p-4 space-y-1">
              <p className="text-xs text-zinc-500">Sucesso</p>
              <p className="text-2xl font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5" />{totalSuccess}
              </p>
            </Card>
            <Card className="bg-zinc-900/50 border-red-900/30 p-4 space-y-1">
              <p className="text-xs text-zinc-500">Falha</p>
              <p className="text-2xl font-bold text-red-400 flex items-center gap-1.5">
                <XCircle className="w-5 h-5" />{totalFail}
              </p>
            </Card>
            <Card className="bg-zinc-900/50 border-zinc-800 p-4 space-y-1">
              <p className="text-xs text-zinc-500">Taxa de sucesso</p>
              <p className="text-2xl font-bold text-zinc-100">{Math.round((totalSuccess / mockFires.length) * 100)}%</p>
            </Card>
          </div>

          {/* Events breakdown */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Eventos por tipo</p>
            <div className="flex flex-wrap gap-2">
              {byEvent.map(([name, count]) => {
                const color = EVENT_COLORS[name] ?? "#6b7280";
                return (
                  <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{ background: `${color}12`, borderColor: `${color}30` }}>
                    <span style={{ color }}>{EVENT_ICONS[name] ?? <Zap className="w-3.5 h-3.5" />}</span>
                    <span className="text-sm font-semibold" style={{ color }}>{name}</span>
                    <span className="text-sm font-bold text-zinc-200">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Fires table */}
          <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_80px] gap-4 px-4 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Contato</span>
              <span>Evento</span>
              <span>Quando</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {mockFires.map((fire) => {
                const color = EVENT_COLORS[fire.eventName] ?? "#6b7280";
                return (
                  <div key={fire.id} className="grid grid-cols-[2fr_1.2fr_1fr_80px] gap-4 px-4 py-3 items-center hover:bg-zinc-800/20 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 font-medium truncate">{fire.conversation.name ?? fire.conversation.phone}</p>
                      {fire.conversation.name && <p className="text-xs text-zinc-600 truncate">{fire.conversation.phone}</p>}
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color }}>
                      {EVENT_ICONS[fire.eventName] ?? <Zap className="w-3.5 h-3.5" />}
                      <span className="text-sm font-medium">{fire.eventName}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{fmtTime(fire.firedAt)}</span>
                    <div>
                      {fire.success ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-xs">
                          <CheckCircle className="w-3 h-3" /> OK
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1 text-xs" title={fire.errorMessage ?? ""}>
                          <XCircle className="w-3 h-3" /> Falha
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

        </main>
      </div>
    </div>
  );
}
