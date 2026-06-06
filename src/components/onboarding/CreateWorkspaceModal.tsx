"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X, ArrowRight, Smartphone, RefreshCw, Copy, Check,
  CheckCircle2, Wifi, ExternalLink,
} from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: (workspaceId: string) => void;
}

export function CreateWorkspaceModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // Step 2
  const [workspaceId, setWorkspaceId] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrError, setQrError] = useState("");
  const [countdown, setCountdown] = useState(150);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);

  const shareLink = typeof window !== "undefined" && workspaceId
    ? `${window.location.origin}/conectar/${workspaceId}`
    : "";

  // Create workspace and go to step 2
  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Erro ao criar conta");
      const data = await res.json();
      setWorkspaceId(data.id);
      setStep(2);
      // Connect WhatsApp after cookie is set
      setTimeout(() => connectWhatsApp(data.id), 200);
    } catch {
      alert("Erro ao criar a conta. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  async function connectWhatsApp(wsId?: string) {
    setLoadingQR(true);
    setQrError("");
    try {
      // Switch to the new workspace cookie first
      await fetch("/api/workspace/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wsId ?? workspaceId }),
      });
      // Now connect
      const res = await fetch("/api/workspace/whatsapp/connect", { method: "POST" });
      const data = await res.json();
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setCountdown(150);
        setQrError("");
      } else {
        setQrError(data.error ?? "Erro ao gerar QR Code");
      }
    } catch {
      setQrError("Falha ao conectar com Evolution API");
    } finally {
      setLoadingQR(false);
    }
  }

  const checkStatus = useCallback(async () => {
    if (!workspaceId) return;
    const res = await fetch(`/api/public/status/${workspaceId}`);
    const data = await res.json();
    if (data.connected) {
      setConnected(true);
      setPhone(data.phone);
    }
  }, [workspaceId]);

  // Poll connection status
  useEffect(() => {
    if (step !== 2 || connected) return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [step, connected, checkStatus]);

  // Countdown + auto-refresh QR
  useEffect(() => {
    if (step !== 2 || connected || !qrCode) return;
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          connectWhatsApp();
          return 150;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [step, connected, qrCode]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCopyLink() {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSkip() {
    onCreated(workspaceId);
  }

  function handleDone() {
    onCreated(workspaceId);
  }

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-zinc-600 font-medium">
          Passo {step} de 3
        </div>

        {/* ── STEP 1: Account name ── */}
        {step === 1 && (
          <div className="px-8 py-10 space-y-6">
            <div className="space-y-1.5 pt-4">
              <h2 className="text-xl font-bold text-zinc-100">Informações da conta</h2>
              <p className="text-sm text-zinc-500">Como se chama o cliente ou negócio que vai usar essa conta?</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-300">
              💡 <strong>Nome da conta</strong> é o nome do cliente cujo WhatsApp você vai conectar aqui.
              Por exemplo: <em>"Clínica da Dra. Ana"</em> ou <em>"Loja da Maria"</em>.
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Nome da conta</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Ex: Odontologia do Dr. João"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-semibold rounded-xl transition-all"
            >
              {creating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>Continuar <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}

        {/* ── STEP 2: WhatsApp QR ── */}
        {step === 2 && (
          <div className="flex flex-col">
            <div className="px-8 pt-8 pb-4 space-y-1">
              <h2 className="text-xl font-bold text-zinc-100">Conectar WhatsApp</h2>
              <p className="text-sm text-zinc-500">
                Escaneie o QR Code com o celular do cliente, ou envie o link abaixo para ele fazer isso.
              </p>
            </div>

            {/* Share link */}
            <div className="px-8 pb-4">
              <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2.5">
                <span className="text-xs text-zinc-500 truncate flex-1 font-mono">{shareLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs font-medium text-zinc-200 transition-all shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
                <a
                  href={shareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">
                ⚠️ Não envie print do QR Code — envie o link acima.
              </p>
            </div>

            {/* QR + connected state */}
            <div className="px-8 pb-8">
              {connected ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-zinc-100">WhatsApp conectado!</p>
                    {phone && <p className="text-sm text-zinc-500 mt-0.5">{phone}</p>}
                  </div>
                  <button
                    onClick={handleDone}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold rounded-xl transition-all"
                  >
                    <Wifi className="w-4 h-4" /> Ir para o painel
                  </button>
                </div>
              ) : (
                <div className="flex gap-6">
                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    {loadingQR ? (
                      <div className="w-[180px] h-[180px] bg-zinc-800 rounded-2xl flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin" />
                      </div>
                    ) : qrError ? (
                      <div className="w-[180px] h-[180px] bg-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 p-4 text-center">
                        <Smartphone className="w-8 h-8 text-zinc-600" />
                        <p className="text-xs text-zinc-500">{qrError}</p>
                        <button onClick={() => connectWhatsApp()} className="text-xs text-emerald-400 hover:text-emerald-300 underline">
                          Tentar novamente
                        </button>
                      </div>
                    ) : qrCode ? (
                      <div className="bg-white p-2.5 rounded-xl shadow">
                        <Image src={qrCode} alt="QR Code" width={160} height={160} />
                      </div>
                    ) : null}

                    {qrCode && !loadingQR && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-zinc-500 font-mono">{mm}:{ss}</span>
                        <button onClick={() => connectWhatsApp()} className="text-zinc-600 hover:text-zinc-400 ml-0.5">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="flex-1 space-y-3">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Como escanear</p>
                    <ol className="space-y-2.5">
                      {[
                        "Abra o <strong>WhatsApp</strong> no celular",
                        "Toque nos <strong>3 pontos</strong> (Android) ou <strong>Ajustes</strong> (iPhone)",
                        "Vá em <strong>Aparelhos conectados</strong>",
                        "Toque em <strong>Conectar um aparelho</strong>",
                        "Aponte a câmera para o <strong>QR Code</strong>",
                      ].map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-zinc-400" dangerouslySetInnerHTML={{ __html: s }} />
                        </li>
                      ))}
                    </ol>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 pt-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Aguardando conexão...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Skip */}
            {!connected && (
              <div className="px-8 py-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={handleSkip}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Conectar depois →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
