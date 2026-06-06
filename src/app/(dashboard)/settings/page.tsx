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
import { Wifi, WifiOff, QrCode, RefreshCw, Save, Zap, Trash2, AlertTriangle } from "lucide-react";
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

  useEffect(() => {
    fetch("/api/workspace/current")
      .then((r) => r.json())
      .then((data) => {
        setWorkspace(data);
        setWorkspaceName(data.name ?? "");
        setPixelId(data.metaPixelId ?? "");
        setTestCode(data.metaTestEventCode ?? "");
        setTokenSaved(!!data.hasAccessToken);
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
