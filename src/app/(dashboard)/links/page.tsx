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
  ChevronDown, ChevronUp, Pencil, Users, Info, Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
}

interface LinkConversation {
  id: string;
  phone: string;
  name: string | null;
  lastMessageAt: string;
  funnelStage: { name: string; color: string } | null;
  _count: { messages: number };
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

type FormState = typeof emptyForm;

function LinkForm({
  initial,
  onSave,
  onCancel,
  saving,
  isEdit,
  campaigns = [],
}: {
  initial: FormState;
  onSave: (form: FormState) => void;
  onCancel: () => void;
  saving: boolean;
  isEdit?: boolean;
  campaigns?: MetaCampaign[];
}) {
  const [form, setForm] = useState(initial);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const set = (updates: Partial<FormState>) => setForm((f) => ({ ...f, ...updates }));
  const previewSlug = form.name
    ? form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30)
    : "meu-link";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
      <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-200">{isEdit ? "Editar Link" : "Novo Link Rastreável"}</h2>
          <button onClick={onCancel} className="text-zinc-600 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <section className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Identificação
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Nome do link <span className="text-red-400">*</span></Label>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })}
              placeholder="Ex: Campanha Meta Junho, Anúncio Instagram..."
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
          </div>
        </section>

        <Separator className="bg-zinc-800" />

        <section className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Mensagem de boas-vindas (opcional)
          </p>
          <textarea
            value={form.welcomeMessage}
            onChange={(e) => set({ welcomeMessage: e.target.value })}
            placeholder="Ex: Olá! Vi seu anúncio e quero saber mais sobre..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              Essa é a mensagem que chega pronta no WhatsApp quando o lead clica no link.
              <span className="text-zinc-300"> Use um texto único</span> — é com base nele que o sistema
              reconhece automaticamente que aquele lead entrou por este link e atribui a origem certa
              (ex: Meta Ads) à conversa.
            </p>
          </div>
        </section>

        <Separator className="bg-zinc-800" />

        <section className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Parâmetros UTM
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "utmSource", label: "UTM Source", placeholder: "facebook, google..." },
              { key: "utmMedium", label: "UTM Medium", placeholder: "cpc, organic..." },
              { key: "utmContent", label: "UTM Content", placeholder: "variacao-a, banner-1..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-zinc-400">{label}</Label>
                <Input
                  value={form[key as keyof FormState] as string}
                  onChange={(e) => set({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
                />
              </div>
            ))}

            {/* UTM Campaign — dropdown se Meta Ads conectado, input manual caso contrário */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 flex items-center gap-1.5">
                UTM Campaign
                {campaigns.length > 0 && (
                  <span className="text-[10px] text-blue-400 flex items-center gap-0.5 font-normal">
                    <Zap className="w-2.5 h-2.5" /> Meta Ads
                  </span>
                )}
              </Label>
              {campaigns.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCampaignOpen((v) => !v)}
                    className="w-full flex items-center justify-between gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-left hover:border-zinc-600 transition-colors"
                  >
                    <span className={form.utmCampaign ? "text-zinc-100 truncate" : "text-zinc-500"}>
                      {form.utmCampaign || "Selecionar campanha..."}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform ${campaignOpen ? "rotate-180" : ""}`} />
                  </button>
                  {campaignOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setCampaignOpen(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => { set({ utmCampaign: "" }); setCampaignOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 transition-colors italic"
                        >
                          Limpar seleção
                        </button>
                        {campaigns.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { set({ utmCampaign: c.name }); setCampaignOpen(false); }}
                            className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                              form.utmCampaign === c.name ? "bg-blue-500/10 text-blue-300" : "text-zinc-300 hover:bg-zinc-800"
                            }`}
                          >
                            <span className="truncate">{c.name}</span>
                            <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded-full font-medium ${
                              c.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-700 text-zinc-500"
                            }`}>
                              {c.status === "ACTIVE" ? "Ativa" : "Pausada"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Input
                  value={form.utmCampaign}
                  onChange={(e) => set({ utmCampaign: e.target.value })}
                  placeholder="nome-da-campanha"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
                />
              )}
            </div>
          </div>
          <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-400 leading-relaxed space-y-1">
              <p>
                O <span className="text-zinc-300">UTM Source</span> é usado para identificar automaticamente
                de onde veio o lead. Preencha com:
              </p>
              <ul className="space-y-0.5 pl-0.5">
                <li><Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] mr-1.5">facebook / instagram / meta</Badge> para campanhas do Meta Ads</li>
                <li><Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] mr-1.5">google</Badge> para campanhas do Google Ads</li>
              </ul>
              <p>O sistema usa esse valor para marcar a conversa com a origem correta nos relatórios e no dashboard.</p>
            </div>
          </div>

          {/* Google Ads ValueTrack helper — sempre visível */}
          <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-400 leading-relaxed space-y-2">
              <p>
                <span className="text-zinc-300 font-medium">Usando Google Ads?</span>{" "}
                Cole esses parâmetros no final da <span className="text-zinc-300">URL final</span> do seu anúncio para rastrear campanha, grupo e clique:
              </p>
              <div className="bg-zinc-900 rounded-md px-2.5 py-2 font-mono text-[10px] text-emerald-300 break-all select-all">
                {`?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&gclid={gclid}&campaignid={campaignid}&adgroupid={adgroupid}&creative={creative}`}
              </div>
              <p className="text-zinc-500">
                Os valores entre chaves são preenchidos automaticamente pelo Google Ads em cada clique.
              </p>
            </div>
          </div>
        </section>

        <Separator className="bg-zinc-800" />

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
                <Input value={form.redirectPageTitle ?? ""}
                  onChange={(e) => set({ redirectPageTitle: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Mensagem da página</Label>
                <Input value={form.redirectPageMessage ?? ""}
                  onChange={(e) => set({ redirectPageMessage: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Tempo de espera (segundos)</Label>
                <Input type="number" min={1} max={10} value={form.redirectDelay}
                  onChange={(e) => set({ redirectDelay: parseInt(e.target.value) || 5 })}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 w-24" />
              </div>
            </div>
          )}
        </section>

        <div className="flex gap-2 pt-1">
          <Button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
            {saving ? (isEdit ? "Salvando..." : "Criando...") : (isEdit ? "Salvar alterações" : "Criar Link")}
          </Button>
          <Button variant="outline" onClick={onCancel} className="border-zinc-700 text-zinc-400">
            Cancelar
          </Button>
        </div>
      </Card>

      {!isEdit && (
        <div className="space-y-3 sticky top-6">
          <Card className="bg-zinc-900/50 border-zinc-800 p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Preview do link</p>
            <div className="bg-zinc-800 rounded-lg p-3 break-all">
              <p className="text-xs text-zinc-500 mb-1">URL gerada:</p>
              <p className="text-sm text-blue-400 font-mono">
                {appUrl}/r/<span className="text-emerald-400">{previewSlug}</span>
              </p>
            </div>
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
      )}
    </div>
  );
}

export default function LinksPage() {
  const [links, setLinks] = useState<TrackableLink[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // conversations panel
  const [convLinkId, setConvLinkId] = useState<string | null>(null);
  const [convs, setConvs] = useState<LinkConversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  // Meta Ads campaigns
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    fetch("/api/links").then((r) => r.json()).then(setLinks);
    // Tenta buscar campanhas do Meta Ads — silencia erro se não conectado
    fetch("/api/workspace/meta/campaigns")
      .then((r) => r.ok ? r.json() : { campaigns: [] })
      .then((d) => setCampaigns(d.campaigns ?? []))
      .catch(() => {});
  }, []);

  async function handleCreate(form: FormState) {
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
      setCreating(false);
      toast.success("Link criado!");
    } else {
      toast.error("Erro ao criar link");
    }
  }

  async function handleEdit(id: string, form: FormState) {
    setSaving(true);
    const res = await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setLinks((l) => l.map((x) => (x.id === id ? { ...x, ...data } : x)));
      setEditingId(null);
      toast.success("Link atualizado!");
    } else {
      toast.error("Erro ao salvar link");
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    setLinks((l) => l.filter((x) => x.id !== id));
    if (convLinkId === id) setConvLinkId(null);
    toast.success("Link removido");
  }

  async function openConversations(linkId: string) {
    if (convLinkId === linkId) {
      setConvLinkId(null);
      return;
    }
    setConvLinkId(linkId);
    setLoadingConvs(true);
    const res = await fetch(`/api/links/${linkId}/conversations`);
    const data = await res.json();
    setConvs(Array.isArray(data) ? data : []);
    setLoadingConvs(false);
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${appUrl}/r/${slug}`);
    toast.success("Link copiado!");
  }

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
        {!creating && !editingId && (
          <Button onClick={() => setCreating(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2">
            <Plus className="w-4 h-4" /> Criar Link Rastreável
          </Button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <LinkForm
          initial={emptyForm}
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
          saving={saving}
          campaigns={campaigns}
        />
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
            const isEditing = editingId === link.id;
            const isConvOpen = convLinkId === link.id;

            if (isEditing) {
              return (
                <div key={link.id}>
                  <LinkForm
                    isEdit
                    initial={{
                      name: link.name,
                      utmSource: link.utmSource ?? "",
                      utmMedium: link.utmMedium ?? "",
                      utmCampaign: link.utmCampaign ?? "",
                      utmContent: link.utmContent ?? "",
                      welcomeMessage: link.welcomeMessage ?? "",
                      hasRedirectPage: link.hasRedirectPage,
                      redirectPageTitle: link.redirectPageTitle ?? emptyForm.redirectPageTitle,
                      redirectPageMessage: link.redirectPageMessage ?? emptyForm.redirectPageMessage,
                      redirectDelay: link.redirectDelay,
                    }}
                    onSave={(form) => handleEdit(link.id, form)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                    campaigns={campaigns}
                  />
                </div>
              );
            }

            return (
              <Card key={link.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
                    <Link2 className="w-4 h-4 text-blue-400" />
                  </div>

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
                    <button
                      onClick={() => openConversations(link.id)}
                      title="Ver conversas deste link"
                      className={`p-2 rounded-lg transition-all ${isConvOpen ? "text-emerald-400 bg-emerald-900/20" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"}`}>
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingId(link.id); setExpandedId(null); setConvLinkId(null); }}
                      title="Editar link"
                      className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
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

                {/* Conversations panel */}
                {isConvOpen && (
                  <div className="border-t border-zinc-800 bg-zinc-800/10">
                    <div className="px-4 py-3 flex items-center gap-2 border-b border-zinc-800/50">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-zinc-200">Conversas originadas por este link</span>
                    </div>

                    {loadingConvs ? (
                      <div className="px-4 py-6 text-center text-sm text-zinc-500">Carregando...</div>
                    ) : convs.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">Nenhuma conversa ainda.</p>
                        <p className="text-xs text-zinc-600 mt-1">Quando alguém clicar neste link e iniciar uma conversa, ela aparecerá aqui.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800/50">
                        {convs.map((c) => (
                          <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                              {(c.name ?? c.phone).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-200 truncate">{c.name ?? c.phone}</p>
                              <p className="text-xs text-zinc-600">{c.phone} · {c._count.messages} mensagens</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {c.funnelStage && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: `${c.funnelStage.color}20`, color: c.funnelStage.color }}
                                >
                                  {c.funnelStage.name}
                                </span>
                              )}
                              <span className="text-xs text-zinc-600">
                                {formatDistanceToNow(new Date(c.lastMessageAt), { locale: ptBR, addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
