import { DashboardClient } from "@/app/(dashboard)/dashboard/dashboard-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const mockStats = {
  totalConversations: 348,
  trackedConversations: 214,
  untrackedConversations: 134,
  trackedRate: 61,
  pixelFires: 187,
  originBreakdown: [
    { origin: "meta_ads",   _count: 142 },
    { origin: "google_ads", _count: 48  },
    { origin: "organic",    _count: 24  },
    { origin: "untracked",  _count: 134 },
  ],
};

const mockConversations = [
  {
    id: "1",
    phone: "5511994821043",
    name: "Beatriz Almeida",
    origin: "meta_ads",
    leadScore: 95,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 2),
    _count: { messages: 18, pixelFires: 3 },
  },
  {
    id: "2",
    phone: "5521987654321",
    name: "Rafael Torres",
    origin: "meta_ads",
    leadScore: 80,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 11),
    _count: { messages: 9, pixelFires: 2 },
  },
  {
    id: "3",
    phone: "5531996420187",
    name: "Camila Ferreira",
    origin: "meta_ads",
    leadScore: 100,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 34),
    _count: { messages: 31, pixelFires: 4 },
  },
  {
    id: "4",
    phone: "5541988731290",
    name: "Lucas Martins",
    origin: "untracked",
    leadScore: 15,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 58),
    _count: { messages: 2, pixelFires: 0 },
  },
  {
    id: "5",
    phone: "5511992038471",
    name: "Mariana Gomes",
    origin: "meta_ads",
    leadScore: 70,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    _count: { messages: 14, pixelFires: 2 },
  },
  {
    id: "6",
    phone: "5519981234567",
    name: "André Nascimento",
    origin: "meta_ads",
    leadScore: 55,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    _count: { messages: 7, pixelFires: 1 },
  },
];

const mockWorkspace = {
  id: "demo",
  name: "Clínica Bella Forma",
  whatsappConnected: true,
  whatsappPhone: "5511994000100",
  role: "owner",
};

const mockAllWorkspaces = [
  mockWorkspace,
  { id: "demo2", name: "Studio Fit Academia", whatsappConnected: true, whatsappPhone: "5521991002233", role: "owner" },
  { id: "demo3", name: "Imobiliária Prime", whatsappConnected: true, whatsappPhone: "5531988550044", role: "owner" },
];

export default function DemoPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeWorkspace={mockWorkspace} allWorkspaces={mockAllWorkspaces} />
        <main className="flex-1 overflow-y-auto">
          <DashboardClient
            workspace={mockWorkspace}
            stats={mockStats}
            onboarding={{ whatsappConnected: true, hasTriggerKeyword: true, hasSaleStage: true, hasTrackableLink: true, hasMetaAdAccount: true }}
            recentConversations={mockConversations}
            funnelStages={[
              { id: "s1", name: "Novo Lead",         color: "#3b82f6", order: 0, isSale: false, count: 87 },
              { id: "s2", name: "Em Negociação",      color: "#8b5cf6", order: 1, isSale: false, count: 54 },
              { id: "s3", name: "Proposta Enviada",   color: "#f59e0b", order: 2, isSale: false, count: 31 },
              { id: "s4", name: "Fechado ✓",          color: "#10b981", order: 3, isSale: true,  count: 18 },
            ]}
            rangeKey="7d"
            rangeLabel="Últimos 7 dias"
          />
        </main>
      </div>
    </div>
  );
}
