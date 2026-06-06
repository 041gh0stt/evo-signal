export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Link2, Plus, Copy, Trash2, MousePointerClick,
  X, ExternalLink, Clock, MessageSquare, Megaphone,
  ChevronDown, ChevronUp,
} from "lucide-react";

interface TrackableLink {
  id: string;
  name: string;
  slug: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  welcomeMessage: string | null;
  hasRedirectPage: boolean;
  redirectPageTitle: string | null;
  redirectPageMessage: string | null;
  redirectDelay: number;
  clicks: number;
  createdAt: string;
}

const emptyForm = {
  name: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  welcomeMessage: "",
  hasRedirectPage: false,
  redirectPageTitle: "Por favor, aguarde alguns segundos.",
  redirectPageMessage: "Estamos conectando você com um atendente...",
  redirectDelay: 5,
};

export default function LinksPage() {
  const [links, setLinks] = useState<TrackableLink[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    fetch("/api/links").then((r) => r.json()).then(setLinks);
  }, []);

  const set = (updates: Partial<typeof emptyForm>) =>
    setForm((f) => ({ ...f, ...updates }));

  async function handleCreate() {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setLinks((l) => [data, ...l]);
      setForm(emptyForm);
      setCreating(false);
      toast.success("Link criado!");
    } else {
      toast.error("Erro ao criar link");
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    setLinks((l) => l.filter((x) => x.id !== id));
    toast.success("Link removido");
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${appUrl}/r/${slug}`);
    toast.success("Link copiado!");
  }

  const previewSlug = form.name
    ? form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30)
    : "meu-link";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-400" />
            Links Rastreáveis
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Crie links únicos para identificar a origem de cada conversa no WhatsApp
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2">
            <Plus className="w-4 h-4" /> Criar Link Rastreável
          </Button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
          {/* Form card */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-200">Novo Link Rastreável</h2>
              <button onClick={() => { setCreating(false); setForm(emptyForm); }}
                className="text-zinc-600 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Identificação */}
            <section className="space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Identificação
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Nome do link <span className="text-red-400">*</span></Label>
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })}
                  placeholder="Ex: Campanha Meta Junho, Anúncio Instagram..."
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
                <p className="text-xs text-zinc-600">Nome interno para identificar este link.</p>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            {/* Mensagem de boas-vindas */}
            <section className="space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Mensagem de boas-vindas (opcional)
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Mensagem pré-preenchida no WhatsApp</Label>
                <textarea
                  value={form.welcomeMessage}
                  onChange={(e) => set({ welcomeMessage: e.target.value })}
                  placeholder="Ex: Olá! Vi seu anúncio e quero saber mais sobre..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-zinc-600">
                  Quando o lead clicar no link, esta mensagem virá pré-digitada no WhatsApp.
                </p>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            {/* UTMs */}
            <section className="space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5" /> Parâmetros UTM (rastreamento de campanhas)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "utmSource", label: "UTM Source", placeholder: "facebook, google..." },
                  { key: "utmMedium", label: "UTM Medium", placeholder: "cpc, organic..." },
                  { key: "utmCampaign", label: "UTM Campaign", placeholder: "nome-da-campanha" },
                  { key: "utmContent", label: "UTM Content", placeholder: "variacao-a, banner-1..." },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">{label}</Label>
                    <Input
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => set({ [key]: e.target.value })}
                      placeholder={placeholder}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
                    />
                  </div>
                ))}
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            {/* Redirect page */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Página de espera para Meta Ads
                </p>
                <Switch
                  checked={form.hasRedirectPage}
                  onCheckedChange={(v) => set({ hasRedirectPage: v })}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              {form.hasRedirectPage && (
                <div className="space-y-3 pl-3 border-l-2 border-blue-600/30">
                  <p className="text-xs text-zinc-500">
                    Mostra uma página intermediária antes de abrir o WhatsApp — necessário para o pixel do Meta Ads capturar o clique.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Título da página</Label>
                    <Input value={form.redirectPageTitle}
                      onChange={(e) => set({ redirectPageTitle: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Mensagem da página</Label>
                    <Input value={form.redirectPageMessage}
                      onChange={(e) => set({ redirectPageMessage: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Tempo de espera (segundos)</Label>
                    <Input type="number" min={1} max={10} value={form.redirectDelay}
                      onChange={(e) => set({ redirectDelay: parseInt(e.target.value) || 5 })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 w-24"
                    />
                  </div>
                </div>
              )}
            </section>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreate} disabled={saving || !form.name.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                {saving ? "Criando..." : "Criar Link"}
              </Button>
              <Button variant="outline" onClick={() => { setCreating(false); setForm(emptyForm); }}
                className="border-zinc-700 text-zinc-400">
                Cancelar
              </Button>
            </div>
          </Card>

          {/* Live preview */}
          <div className="space-y-3 sticky top-6">
            <Card className="bg-zinc-900/50 border-zinc-800 p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Preview do link</p>
              <div className="bg-zinc-800 rounded-lg p-3 break-all">
                <p className="text-xs text-zinc-500 mb-1">URL gerada:</p>
                <p className="text-sm text-blue-400 font-mono">
                  {appUrl}/r/<span className="text-emerald-400">{previewSlug}</span>
                </p>
              </div>
              {(form.utmSource || form.utmMedium || form.utmCampaign) && (
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">UTMs adicionados:</p>
                  {form.utmSource && <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs mr-1">source: {form.utmSource}</Badge>}
                  {form.utmMedium && <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs mr-1">medium: {form.utmMedium}</Badge>}
                  {form.utmCampaign && <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs mr-1">campaign: {form.utmCampaign}</Badge>}
                </div>
              )}
              {form.hasRedirectPage && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Página de espera ativa ({form.redirectDelay}s)
                  </p>
                  <p className="text-xs text-zinc-400">{form.redirectPageTitle}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{form.redirectPageMessage}</p>
                </div>
              )}
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 p-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Como funciona</p>
              <ol className="text-xs text-zinc-500 space-y-1.5 list-none">
                {[
                  "Lead clica no link do anúncio",
                  "Pixel do Meta registra o clique",
                  "WhatsApp abre com mensagem pré-preenchida",
                  "Conversa é rastreada automaticamente",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      )}

      {/* Links list */}
      <div className="space-y-2">
        {links.length === 0 && !creating ? (
          <Card className="bg-zinc-900/50 border-zinc-800 p-10 text-center">
            <Link2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum link criado ainda.</p>
            <p className="text-zinc-600 text-xs mt-1">Clique em "Criar Link Rastreável" para começar.</p>
          </Card>
        ) : (
          links.map((link) => {
            const isExpanded = expandedId === link.id;
            return (
              <Card key={link.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
                    <Link2 className="w-4 h-4 text-blue-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-100">{link.name}</span>
                      {link.hasRedirectPage && (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs gap-1">
                          <Clock className="w-3 h-3" /> Página de espera
                        </Badge>
                      )}
                      {link.utmSource && (
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{link.utmSource}</Badge>
                      )}
                      {link.utmCampaign && (
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{link.utmCampaign}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <code className="text-xs text-zinc-500 font-mono">{appUrl}/r/{link.slug}</code>
                      <span className="text-xs text-zinc-600 flex items-center gap-1">
                        <MousePointerClick className="w-3 h-3" /> {link.clicks} cliques
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => copyLink(link.slug)}
                      title="Copiar link"
                      className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all">
                      <Copy className="w-4 h-4" />
                    </button>
                    <a href={`${appUrl}/r/${link.slug}`} target="_blank" rel="noreferrer"
                      title="Testar link"
                      className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => setExpandedId(isExpanded ? null : link.id)}
                      title={isExpanded ? "Fechar detalhes" : "Ver detalhes"}
                      className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(link.id)}
                      title="Excluir"
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-800/20">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      {link.welcomeMessage && (
                        <div>
                          <p className="text-zinc-500 mb-1 font-medium">Mensagem de boas-vindas</p>
                          <p className="text-zinc-300 bg-zinc-800 rounded p-2 italic">{link.welcomeMessage}</p>
                        </div>
                      )}
                      {(link.utmSource || link.utmMedium || link.utmCampaign || link.utmContent) && (
                        <div>
                          <p className="text-zinc-500 mb-1 font-medium">UTM Parameters</p>
                          <div className="space-y-0.5">
                            {link.utmSource && <p className="text-zinc-400"><span className="text-zinc-600">source:</span> {link.utmSource}</p>}
                            {link.utmMedium && <p className="text-zinc-400"><span className="text-zinc-600">medium:</span> {link.utmMedium}</p>}
                            {link.utmCampaign && <p className="text-zinc-400"><span className="text-zinc-600">campaign:</span> {link.utmCampaign}</p>}
                            {link.utmContent && <p className="text-zinc-400"><span className="text-zinc-600">content:</span> {link.utmContent}</p>}
                          </div>
                        </div>
                      )}
                      {link.hasRedirectPage && (
                        <div>
                          <p className="text-zinc-500 mb-1 font-medium">Página de espera ({link.redirectDelay}s)</p>
                          <p className="text-zinc-300">{link.redirectPageTitle}</p>
                          <p className="text-zinc-500 mt-0.5">{link.redirectPageMessage}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-zinc-500 mb-1 font-medium">Criado em</p>
                        <p className="text-zinc-400">{new Date(link.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
