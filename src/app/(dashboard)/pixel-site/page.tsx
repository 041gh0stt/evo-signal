export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, CheckCircle, XCircle, MousePointerClick, Eye, Zap, MessageCircle } from "lucide-react";
import { PixelSiteClient } from "./pixel-site-client";

export default async function PixelSitePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");

  const events = await prisma.sitePixelEvent.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalPageViews = events.filter((e) => e.eventName === "PageView").length;
  const totalLeads     = events.filter((e) => e.eventName === "Lead").length;
  const totalSentMeta  = events.filter((e) => e.sentToMeta).length;
  const totalWithGclid = events.filter((e) => e.gclid).length;

  const EVENT_ICONS: Record<string, React.ReactNode> = {
    PageView:      <Eye className="w-3 h-3" />,
    Lead:          <Zap className="w-3 h-3" />,
    ButtonClick:   <MousePointerClick className="w-3 h-3" />,
    WhatsAppClick: <MessageCircle className="w-3 h-3" />,
  };

  const EVENT_COLORS: Record<string, string> = {
    PageView:      "#6b7280",
    Lead:          "#3b82f6",
    ButtonClick:   "#f59e0b",
    WhatsAppClick: "#25d366",
    Purchase:      "#10b981",
    Contact:       "#8b5cf6",
  };

  // Snippet gerado com o workspace ID real — carrega o pingo-pixel.js externo
  const appUrl = (process.env.NEXTAUTH_URL ?? "https://seu-dominio.com").replace(/\/$/, "");
  const snippet = `<!-- Pingo Site Pixel -->
<script>
(function(w,d){
  w.pingo={workspaceId:'${workspace.id}'};
  var s=d.createElement('script');
  s.async=1;s.src='${appUrl}/pingo-pixel.js';
  d.getElementsByTagName('head')[0].appendChild(s);
})(window,document);
</script>`;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          Pixel de Site
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Rastreie visitas e eventos da sua landing page antes do lead entrar no WhatsApp
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-zinc-100">{totalPageViews}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <Eye className="w-3 h-3" /> Visualizações
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-blue-400">{totalLeads}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Leads
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-emerald-400">{totalSentMeta}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Enviados ao Meta
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4">
          <div className="text-2xl font-bold text-yellow-400">{totalWithGclid}</div>
          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <MousePointerClick className="w-3 h-3" /> Cliques Google Ads
          </div>
        </Card>
      </div>

      {/* Snippet */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-200">Instalar na Landing Page</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Cole esse código no <code className="text-zinc-400">&lt;head&gt;</code> da sua página.
              <span className="text-zinc-300"> PageView</span> e <span className="text-zinc-300">WhatsAppClick</span> são disparados automaticamente — sem código extra.
            </p>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <PixelSiteClient snippet={snippet} workspaceId={workspace.id} />
        </div>
      </Card>

      {/* Como usar */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-4 space-y-3">
        <p className="text-sm font-semibold text-zinc-200">Como rastrear outros eventos</p>
        <p className="text-xs text-zinc-400">
          O pixel dispara <span className="text-zinc-300">PageView</span> e <span className="text-zinc-300">WhatsAppClick</span> automaticamente.
          Para eventos extras, use <code className="text-zinc-300">Pingo.track()</code>:
        </p>
        <div className="space-y-2">
          <div className="bg-zinc-950 rounded-md p-3 font-mono text-xs">
            <span className="text-zinc-500">{"// Disparado automaticamente em links wa.me"}</span>
            <br />
            <span className="text-blue-400">{"Pingo.track"}</span>
            <span className="text-zinc-300">{"('WhatsAppClick', { link: 'wa.me/...' })"}</span>
          </div>
          <div className="bg-zinc-950 rounded-md p-3 font-mono text-xs">
            <span className="text-zinc-500">{"// Lead manual (ex: formulário enviado)"}</span>
            <br />
            <span className="text-blue-400">{"Pingo.track"}</span>
            <span className="text-zinc-300">{"('Lead', { form: 'contato' })"}</span>
          </div>
          <div className="bg-zinc-950 rounded-md p-3 font-mono text-xs">
            <span className="text-zinc-500">{"// Qualquer evento personalizado"}</span>
            <br />
            <span className="text-blue-400">{"Pingo.track"}</span>
            <span className="text-zinc-300">{"('VideoPlay', { video: 'depoimento' })"}</span>
          </div>
        </div>
      </Card>

      {/* Log de eventos */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <p className="text-sm font-semibold text-zinc-200">Eventos recentes</p>
          <p className="text-xs text-zinc-500 mt-0.5">Últimos 200 eventos recebidos</p>
        </div>

        {events.length === 0 ? (
          <div className="p-10 text-center">
            <Globe className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum evento ainda.</p>
            <p className="text-zinc-600 text-xs mt-1">
              Instale o pixel na sua landing page e os eventos aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_100px_1fr_1fr_80px] gap-3 px-4 py-2.5 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Página</span>
              <span>Evento</span>
              <span>Origem</span>
              <span>Quando</span>
              <span>Meta</span>
            </div>
            {events.map((ev) => {
              const color = EVENT_COLORS[ev.eventName] ?? "#6b7280";
              return (
                <div
                  key={ev.id}
                  className="grid grid-cols-[1fr_100px_1fr_1fr_80px] gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors items-center"
                >
                  {/* URL */}
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-300 truncate" title={ev.url ?? ""}>
                      {ev.url ? ev.url.replace(/^https?:\/\/[^/]+/, "") || "/" : "—"}
                    </p>
                    {ev.referrer && (
                      <p className="text-[10px] text-zinc-600 truncate">via {ev.referrer.replace(/^https?:\/\//, "")}</p>
                    )}
                  </div>

                  {/* Event */}
                  <div>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${color}20`, color }}
                    >
                      {EVENT_ICONS[ev.eventName] ?? <Zap className="w-3 h-3" />}
                      {ev.eventName}
                    </span>
                  </div>

                  {/* Origem */}
                  <div className="text-xs text-zinc-400 space-y-0.5">
                    {ev.utmSource && (
                      <p className="truncate">
                        <span className="text-zinc-500">src:</span> {ev.utmSource}
                        {ev.utmCampaign && <span className="text-zinc-600"> / {ev.utmCampaign}</span>}
                      </p>
                    )}
                    {ev.gclid && (
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px] py-0">
                        Google Ads
                      </Badge>
                    )}
                    {ev.fbc && (
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] py-0">
                        Meta Ads
                      </Badge>
                    )}
                    {!ev.utmSource && !ev.gclid && !ev.fbc && (
                      <span className="text-zinc-600">orgânico</span>
                    )}
                  </div>

                  {/* Quando */}
                  <div className="text-xs text-zinc-500">
                    {formatDistanceToNow(ev.createdAt, { locale: ptBR, addSuffix: true })}
                  </div>

                  {/* Meta status */}
                  <div>
                    {ev.sentToMeta ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-[10px]">
                        <CheckCircle className="w-3 h-3" /> OK
                      </Badge>
                    ) : ev.metaError ? (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1 text-[10px]">
                        <XCircle className="w-3 h-3" /> Erro
                      </Badge>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Card>
    </div>
  );
}
