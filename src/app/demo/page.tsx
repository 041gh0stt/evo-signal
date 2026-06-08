import { DashboardClient } from "@/app/(dashboard)/dashboard/dashboard-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const mockStats = {
  totalConversations: 127,
  trackedConversations: 25,
  untrackedConversations: 102,
  trackedRate: 20,
  pixelFires: 18,
  originBreakdown: [
    { origin: "meta_ads", _count: 25 },
    { origin: "google_ads", _count: 0 },
    { origin: "organic", _count: 0 },
    { origin: "untracked", _count: 102 },
  ],
};

const mockConversations = [
  {
    id: "1",
    phone: "5511999990001",
    name: "Ana Paula Lima",
    origin: "meta_ads",
    leadScore: 80,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5),
    _count: { messages: 12, pixelFires: 2 },
  },
  {
    id: "2",
    phone: "5511999990002",
    name: "Carlos Mendes",
    origin: "untracked",
    leadScore: 20,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 22),
    _count: { messages: 3, pixelFires: 0 },
  },
  {
    id: "3",
    phone: "5511999990003",
    name: "Fernanda Costa",
    origin: "meta_ads",
    leadScore: 100,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60),
    _count: { messages: 24, pixelFires: 3 },
  },
  {
    id: "4",
    phone: "5521988880004",
    name: "Roberto Silva",
    origin: "untracked",
    leadScore: 0,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    _count: { messages: 1, pixelFires: 0 },
  },
  {
    id: "5",
    phone: "5521988880005",
    name: "Juliana Ramos",
    origin: "meta_ads",
    leadScore: 60,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    _count: { messages: 8, pixelFires: 1 },
  },
];

const mockWorkspace = {
  id: "demo",
  name: "Beltez Odontologia",
  whatsappConnected: true,
  whatsappPhone: "5511999990000",
  role: "owner",
};

const mockAllWorkspaces = [
  mockWorkspace,
  { id: "demo2", name: "Dr. Renato Peréa", whatsappConnected: true, whatsappPhone: "5593991072525", role: "owner" },
  { id: "demo3", name: "Rodolfo Kinshoku", whatsappConnected: false, whatsappPhone: null, role: "owner" },
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
            funnelStages={[]}
            rangeKey="7d"
            rangeLabel="Últimos 7 dias"
          />
        </main>
      </div>
    </div>
  );
}
