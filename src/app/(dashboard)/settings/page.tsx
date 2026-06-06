"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Wifi, WifiOff, QrCode, RefreshCw, Save, Zap, Download, ChevronDown, Link } from "lucide-react";
import Image from "next/image";

interface WorkspaceSettings {
  id: string;
  name: string;
  whatsappConnected: boolean;
  whatsappPhone: string | null;
  whatsappInstanceId: string | null;
  metaPixelId: string | null;
  metaTestEventCode: string | null;
}

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testCode, setTestCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/workspace/current")
      .then((r) => r.json())
      .then((data) => {
        setWorkspace(data);
        setPixelId(data.metaPixelId ?? "");
        setTestCode(data.metaTestEventCode ?? "");
      });
  }, []);

  const checkStatus = useCallback(async () => {
    const res = await fetch("/api/workspace/whatsapp/status");
    const data = await res.json();
    if (data.connected) {
      setWorkspace((w) => w ? { ...w, whatsappConnected: true, whatsappPhone: data.phone } : w);
      setQrCode(null);
      setPolling(false);
      toast.success("WhatsApp conectado com sucesso!");
    }
  }, []);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [polling, checkStatus]);

  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; contact: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncLimit, setSyncLimit] = useState<string>("50");
  const [showSyncOptions, setShowSyncOptions] = useState(false);
  const syncBtnRef = useRef<HTMLButtonElement>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

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

  async function handleSyncHistory() {
    setShowSyncOptions(false);
    setSyncing(true);
    setSyncProgress(null);
    setSyncStatus("Iniciando...");
    try {
      const limit = syncLimit === "all" ? null : parseInt(syncLimit, 10);
      const res = await fetch("/api/workspace/whatsapp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit }),
      });
      if (!res.body) throw new Error("Sem resposta do servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "status") {
              setSyncStatus(event.message);
            } else if (event.type === "progress") {
              setSyncProgress({ current: event.current, total: event.total, contact: event.contact });
              setSyncStatus(`Importando contato ${event.current} de ${event.total}`);
            } else if (event.type === "done") {
              toast.success(event.message);
              setSyncProgress(null);
              setSyncStatus(null);
            } else if (event.type === "error") {
              toast.error(event.message);
              setSyncStatus(null);
            }
          } catch { /* ignora JSON inválido */ }
        }
      }
    } catch {
      toast.error("Falha ao conectar com a Evolution API");
      setSyncStatus(null);
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }

  async function handleSaveWebhook() {
    if (!webhookUrl) return;
    setSavingWebhook(true);
    try {
      const res = await fetch("/api/workspace/whatsapp/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Webhook registrado: ${data.webhookUrl}`);
      } else {
        toast.error(data.error ?? "Erro ao registrar webhook");
      }
    } catch {
      toast.error("Falha ao registrar webhook");
    } finally {
      setSavingWebhook(false);
    }
  }

  async function handleDisconnect() {
    await fetch("/api/workspace/whatsapp/disconnect", { method: "POST" });
    setWorkspace((w) => w ? { ...w, whatsappConnected: false, whatsappPhone: null } : w);
    toast.success("WhatsApp desconectado");
  }

  async function handleSavePixel() {
    setSaving(true);
    const res = await fetch("/api/workspace/pixel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metaPixelId: pixelId, metaAccessToken: accessToken, metaTestEventCode: testCode }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Configurações do pixel salvas!");
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

      {/* WhatsApp */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-400" />
              Conexão WhatsApp
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Via Evolution API</p>
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
              <div className="flex items-center gap-2">
                {/* Importar histórico com seletor de quantidade */}
                <div className="flex">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={syncing}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1.5 rounded-r-none border-r-0"
                    onClick={handleSyncHistory}
                  >
                    {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {syncing
                      ? "Importando..."
                      : syncLimit === "all"
                        ? "Importar tudo"
                        : `Importar ${syncLimit} conversas`}
                  </Button>
                  <Button
                    ref={syncBtnRef}
                    variant="outline"
                    size="sm"
                    disabled={syncing}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-l-none px-2"
                    onClick={() => setShowSyncOptions((v) => !v)}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {showSyncOptions && (() => {
                  const rect = syncBtnRef.current?.getBoundingClientRect();
                  return (
                    <>
                      {/* backdrop para fechar ao clicar fora */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowSyncOptions(false)} />
                      <div
                        className="fixed z-50 w-52 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
                        style={{ top: (rect?.bottom ?? 0) + 6, right: window.innerWidth - (rect?.right ?? 0) }}
                      >
                        <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider px-3 pt-3 pb-1">Quantas conversas importar?</p>
                        {[
                          { value: "20", label: "Últimas 20 conversas" },
                          { value: "50", label: "Últimas 50 conversas" },
                          { value: "100", label: "Últimas 100 conversas" },
                          { value: "200", label: "Últimas 200 conversas" },
                          { value: "all", label: "Tudo (pode demorar)" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between
                              ${syncLimit === opt.value
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "text-zinc-300 hover:bg-zinc-800"
                              }`}
                            onClick={() => { setSyncLimit(opt.value); setShowSyncOptions(false); }}
                          >
                            {opt.label}
                            {syncLimit === opt.value && <span className="text-emerald-400 text-xs">✓</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}

                <Button variant="outline" size="sm" className="border-red-800 text-red-400 hover:bg-red-900/20" onClick={handleDisconnect}>
                  Desconectar
                </Button>
              </div>
            </div>

            {/* Webhook URL */}
            <div className="border border-zinc-800 rounded-xl p-4 space-y-2.5">
              <div>
                <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-zinc-500" />
                  URL do Webhook
                </p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  Para receber mensagens em tempo real. Use o domínio do Vercel ou um túnel ngrok.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://seu-app.vercel.app"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm h-8"
                />
                <Button
                  size="sm"
                  disabled={!webhookUrl || savingWebhook}
                  onClick={handleSaveWebhook}
                  className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 h-8 shrink-0"
                >
                  {savingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Registrar"}
                </Button>
              </div>
            </div>

            {/* Progresso de sincronização */}
            {syncing && (
              <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                  <span className="text-sm text-zinc-200 font-medium">{syncStatus ?? "Processando..."}</span>
                </div>
                {syncProgress && (
                  <>
                    <div className="w-full bg-zinc-700 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      Contato: <span className="text-zinc-400">{syncProgress.contact}</span>
                    </p>
                  </>
                )}
              </div>
            )}
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
            <Input
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              type="password"
              placeholder="EAAxxxxxxx..."
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
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
    </div>
  );
}
