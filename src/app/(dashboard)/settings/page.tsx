"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Wifi, WifiOff, QrCode, RefreshCw, Save, Zap, Trash2, AlertTriangle, Link2, Unlink, ChevronDown, Check } from "lucide-react";
import Image from "next/image";

interface WorkspaceSettings {
  id: string;
  name: string;
  whatsappConnected: boolean;
  whatsappPhone: string | null;
  whatsappInstanceId: string | null;
  metaPixelId: string | null;
  metaTestEventCode: string | null;
  hasAccessToken: boolean;
  metaConnected: boolean;
  metaAdAccountId: string | null;
}

interface AdAccount {
  id: string;
  accountId: string;
  name: string;
  currency: string;
  status: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testCode, setTestCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  // Meta Ads connection
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loadingAdAccounts, setLoadingAdAccounts] = useState(false);
  const [adAccountOpen, setAdAccountOpen] = useState(false);
  const [savingAdAccount, setSavingAdAccount] = useState(false);
  const [disconnectingMeta, setDisconnectingMeta] = useState(false);

  const loadAdAccounts = useCallback(async () => {
    setLoadingAdAccounts(true);
    try {
      const res = await fetch("/api/workspace/meta/adaccounts");
      const data = await res.json();
      if (res.ok) setAdAccounts(data.accounts ?? []);
    } catch { /* ignore */ }
    setLoadingAdAccounts(false);
  }, []);

  async function handleSelectAdAccount(adAccountId: string) {
    setAdAccountOpen(false);
    setSavingAdAccount(true);
    const res = await fetch("/api/workspace/meta/adaccount", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adAccountId }),
    });
    setSavingAdAccount(false);
    if (res.ok) {
      setWorkspace((w) => w ? { ...w, metaAdAccountId: adAccountId } : w);
      toast.success("Conta de anúncios selecionada!");
    } else {
      toast.error("Erro ao salvar conta de anúncios");
    }
  }

  async function handleDisconnectMeta() {
    setDisconnectingMeta(true);
    const res = await fetch("/api/workspace/meta/adaccount", { method: "DELETE" });
    setDisconnectingMeta(false);
    if (res.ok) {
      setWorkspace((w) => w ? { ...w, metaConnected: false, metaAdAccountId: null } : w);
      setAdAccounts([]);
      toast.success("Meta Ads desconectado");
    } else {
      toast.error("Erro ao desconectar");
    }
  }

  useEffect(() => {
    // Trata retorno do OAuth do Meta
    const params = new URLSearchParams(window.location.search);
    if (params.get("meta_connected")) {
      toast.success("Conta do Meta conectada!");
      window.history.replaceState({}, "", "/settings");
    } else if (params.get("meta_error")) {
      toast.error("Erro ao conectar com o Meta. Tente novamente.");
      window.history.replaceState({}, "", "/settings");
    }

    fetch("/api/workspace/current")
      .then((r) => r.json())
      .then(async (data) => {
        setWorkspace(data);
        setWorkspaceName(data.name ?? "");
        setPixelId(data.metaPixelId ?? "");
        setTestCode(data.metaTestEventCode ?? "");
        setTokenSaved(!!data.hasAccessToken);

        if (data.metaConnected) loadAdAccounts();

        // Se conectado mas sem número, sincroniza com Evolution API
        if (data.whatsappConnected) {
          try {
            const statusRes = await fetch("/api/workspace/whatsapp/status");
            const statusData = await statusRes.json();
            if (statusData.connected && statusData.phone) {
              setWorkspace((w) => w ? { ...w, whatsappPhone: statusData.phone } : w);
            }
          } catch { /* silencia erro de sync */ }
        }
      });
  }, []);

  const checkStatus = useCallback(async () => {
    const res = await fetch("/api/workspace/whatsapp/status");
    const data = await res.json();
    if (data.connected) {
      setWorkspace((w) => w ? { ...w, whatsappConnected: true, whatsappPhone: data.phone } : w);
      setQrCode(null);
      setPolling(false);
      toast.success("WhatsApp conectado!");
      startTransition(() => router.refresh());
    }
  }, []);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [polling, checkStatus]);

  const [connecting, setConnecting] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleConnectWhatsApp() {
    setConnecting(true);
    try {
      const res = await fetch("/api/workspace/whatsapp/connect", { method: "POST" });
      const data = await res.json();
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setPolling(true);
        toast.info("Escaneie o QR Code com seu WhatsApp");
      } else {
        toast.error(data.error ?? "Erro ao gerar QR Code. Tente novamente.");
      }
    } catch {
      toast.error("Falha na conexão com a Evolution API");
    } finally {
      setConnecting(false);
    }
  }

  async function handleSaveName() {
    if (!workspaceName.trim()) return;
    setSavingName(true);
    const res = await fetch("/api/workspace/rename", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workspaceName }),
    });
    setSavingName(false);
    if (res.ok) {
      setWorkspace((w) => w ? { ...w, name: workspaceName } : w);
      toast.success("Nome atualizado!");
    } else {
      toast.error("Erro ao salvar nome");
    }
  }

  async function handleClearConversations() {
    setClearing(true);
    const res = await fetch("/api/workspace/conversations/clear", { method: "DELETE" });
    setClearing(false);
    setConfirmClear(false);
    if (res.ok) {
      const d = await res.json();
      toast.success(`${d.deleted} conversa(s) apagada(s). Novas mensagens chegam automaticamente.`);
    } else {
      toast.error("Erro ao apagar conversas");
    }
  }

  async function handleDisconnect() {
    await fetch("/api/workspace/whatsapp/disconnect", { method: "POST" });
    setWorkspace((w) => w ? { ...w, whatsappConnected: false, whatsappPhone: null } : w);
    toast.success("WhatsApp desconectado");
    startTransition(() => router.refresh());
  }

  async function handleSavePixel() {
    setSaving(true);
    const res = await fetch("/api/workspace/pixel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaPixelId: pixelId,
        metaTestEventCode: testCode,
        // Só envia o token se o usuário digitou um novo (não apaga o existente)
        ...(accessToken ? { metaAccessToken: accessToken } : {}),
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Configurações do pixel salvas!");
      if (accessToken) setTokenSaved(true);
      setAccessToken("");
    } else {
      toast.error("Erro ao salvar configurações");
    }
  }

  if (!workspace) {
    return <div className="p-6 text-zinc-500 text-sm">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Configurações</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Conecte seu WhatsApp e configure o Meta Pixel</p>
      </div>

      {/* Nome da conta */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Nome da conta</h2>
        <div className="flex gap-2">
          <Input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Ex: Beltez Odontologia"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
          />
          <Button
            onClick={handleSaveName}
            disabled={savingName || !workspaceName.trim()}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 shrink-0"
          >
            {savingName ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-zinc-600">Este nome também é usado para identificar a instância do WhatsApp.</p>
      </Card>

      <Separator className="bg-zinc-800" />

      {/* WhatsApp */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-400" />
              Conexão WhatsApp
            </h2>
          </div>
          {workspace.whatsappConnected ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1.5">
              <Wifi className="w-3 h-3" /> Conectado
            </Badge>
          ) : (
            <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 gap-1.5">
              <WifiOff className="w-3 h-3" /> Desconectado
            </Badge>
          )}
        </div>

        {workspace.whatsappConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Número conectado</p>
                <p className="text-sm font-medium text-zinc-200">{workspace.whatsappPhone ?? "—"}</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-800 text-red-400 hover:bg-red-900/20" onClick={handleDisconnect}>
                  Desconectar
                </Button>
              </div>
          </div>
        ) : qrCode ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="bg-white p-3 rounded-xl">
              <Image src={qrCode} alt="QR Code WhatsApp" width={200} height={200} />
            </div>
            <p className="text-xs text-zinc-500">Abra o WhatsApp → Dispositivos Vinculados → Vincular dispositivo</p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Aguardando conexão...
            </div>
          </div>
        ) : (
          <Button onClick={handleConnectWhatsApp} disabled={connecting} className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold">
            {connecting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
            {connecting ? "Preparando..." : "Conectar WhatsApp"}
          </Button>
        )}
      </Card>

      <Separator className="bg-zinc-800" />

      {/* Meta Ads */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4 overflow-visible">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-500" />
              Meta Ads
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Conecte sua conta para filtrar resultados por campanha</p>
          </div>
          {workspace.metaConnected ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1.5">
              <Check className="w-3 h-3" /> Conectado
            </Badge>
          ) : (
            <Badge className="bg-zinc-800 text-zinc-500 border border-zinc-700 gap-1.5">
              Não conectado
            </Badge>
          )}
        </div>

        {workspace.metaConnected ? (
          <div className="space-y-3">
            {/* Ad account selector */}
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-xs">Conta de anúncios</Label>
              <div className="relative">
                <button
                  onClick={() => setAdAccountOpen((v) => !v)}
                  disabled={loadingAdAccounts || savingAdAccount}
                  className="w-full flex items-center justify-between gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-left hover:border-zinc-600 transition-colors disabled:opacity-60"
                >
                  <span className={adAccounts.find((a) => a.id === workspace.metaAdAccountId) ? "text-zinc-100" : "text-zinc-500"}>
                    {loadingAdAccounts
                      ? "Carregando contas..."
                      : adAccounts.find((a) => a.id === workspace.metaAdAccountId)?.name
                        ?? "Selecione uma conta de anúncios"}
                  </span>
                  {savingAdAccount ? (
                    <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin shrink-0" />
                  ) : (
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${adAccountOpen ? "rotate-180" : ""}`} />
                  )}
                </button>

                {adAccountOpen && !loadingAdAccounts && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setAdAccountOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                      {adAccounts.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-zinc-500">Nenhuma conta de anúncios encontrada</div>
                      ) : (
                        adAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            onClick={() => handleSelectAdAccount(acc.id)}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                              acc.id === workspace.metaAdAccountId
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "text-zinc-300 hover:bg-zinc-800"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">{acc.name}</p>
                              <p className="text-xs text-zinc-600">{acc.accountId} · {acc.currency}</p>
                            </div>
                            {acc.id === workspace.metaAdAccountId && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnectMeta}
              disabled={disconnectingMeta}
              className="border-red-800 text-red-400 hover:bg-red-900/20 gap-1.5"
            >
              <Unlink className="w-3.5 h-3.5" />
              {disconnectingMeta ? "Desconectando..." : "Desconectar Meta"}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => { window.location.href = "/api/auth/meta"; }}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
          >
            <Link2 className="w-4 h-4" />
            Conectar conta do Meta
          </Button>
        )}
      </Card>

      <Separator className="bg-zinc-800" />

      {/* Meta Pixel */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            Meta Conversions API
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Server-side pixel — mais preciso que o pixel client-side</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-xs">Pixel ID</Label>
            <Input
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              placeholder="123456789012345"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-xs">Access Token (Conversions API)</Label>
            <div className="relative">
              <Input
                value={accessToken}
                onChange={(e) => { setAccessToken(e.target.value); if (e.target.value === "") setTokenSaved(!!workspace?.hasAccessToken); }}
                type="password"
                placeholder={tokenSaved ? "••••••••••••••••  (token salvo — deixe em branco para manter)" : "EAAxxxxxxx..."}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 pr-24"
              />
              {tokenSaved && !accessToken && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Save className="w-3 h-3" /> Salvo
                </span>
              )}
            </div>
            {tokenSaved && !accessToken && (
              <p className="text-xs text-zinc-600">Token atual mantido. Digite um novo para substituir.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-xs">Test Event Code (opcional)</Label>
            <Input
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="TEST12345"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
            <p className="text-xs text-zinc-600">Use para testar sem afetar dados reais</p>
          </div>
        </div>

        <Button onClick={handleSavePixel} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configurações do Pixel"}
        </Button>
      </Card>

      <Separator className="bg-zinc-800" />

      {/* Zona de perigo */}
      <Card className="bg-zinc-900/50 border-red-900/40 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Zona de Perigo
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-300">Apagar todas as conversas</p>
            <p className="text-xs text-zinc-600 mt-0.5">Remove o histórico importado. Novas mensagens continuam chegando normalmente pelo WhatsApp.</p>
          </div>

          {confirmClear ? (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2 shrink-0">
              <span className="text-xs text-red-300">Tem certeza?</span>
              <button
                onClick={handleClearConversations}
                disabled={clearing}
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                {clearing ? "Apagando..." : "Sim, apagar tudo"}
              </button>
              <span className="text-zinc-700">·</span>
              <button onClick={() => setConfirmClear(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
                Cancelar
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClear(true)}
              className="border-red-800 text-red-400 hover:bg-red-900/20 gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Apagar conversas
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
