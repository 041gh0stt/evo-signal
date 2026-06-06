"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Image from "next/image";
import { Smartphone, RefreshCw, CheckCircle2, Wifi } from "lucide-react";

const STEPS_ANDROID = [
  "Abra o <strong>WhatsApp</strong> no seu smartphone",
  "Toque nos <strong>três pontos</strong> no canto superior direito",
  "Toque em <strong>Aparelhos conectados</strong>",
  "Toque em <strong>Conectar um aparelho</strong>",
  "Aponte a câmera para o <strong>QR Code</strong> ao lado",
];

const STEPS_IPHONE = [
  "Abra o <strong>WhatsApp</strong> no seu iPhone",
  "Toque em <strong>Configurações</strong> (ícone de engrenagem)",
  "Toque em <strong>Aparelhos conectados</strong>",
  "Toque em <strong>Conectar um aparelho</strong>",
  "Aponte a câmera para o <strong>QR Code</strong> ao lado",
];

export default function ConectarPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [connected, setConnected] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [os, setOs] = useState<"android" | "iphone">("android");
  const [countdown, setCountdown] = useState(150); // 2:30 min

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/qr/${workspaceId}`);
      const data = await res.json();
      if (data.connected) {
        setConnected(true);
        return;
      }
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setWorkspaceName(data.workspaceName ?? "");
        setCountdown(150);
        setError("");
      } else {
        setError(data.error ?? "QR não disponível");
      }
    } catch {
      setError("Erro ao carregar QR Code");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const checkStatus = useCallback(async () => {
    const res = await fetch(`/api/public/status/${workspaceId}`);
    const data = await res.json();
    if (data.connected) {
      setConnected(true);
      setPhone(data.phone);
      setWorkspaceName(data.name ?? "");
    }
  }, [workspaceId]);

  // Initial load
  useEffect(() => { fetchQR(); }, [fetchQR]);

  // Poll status
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [connected, checkStatus]);

  // Countdown + auto-refresh QR
  useEffect(() => {
    if (connected || !qrCode) return;
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchQR();
          return 150;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [connected, qrCode, fetchQR]);

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  if (connected) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">WhatsApp conectado!</h1>
            <p className="text-zinc-400 mt-2">
              {workspaceName && <span className="font-semibold text-zinc-200">{workspaceName}</span>}
              {phone && <span className="text-zinc-400"> · {phone}</span>}
            </p>
            <p className="text-zinc-500 text-sm mt-3">
              Você já pode fechar esta página.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Conexão ativa</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-100">Escanear QR Code</h1>
            {workspaceName && (
              <p className="text-xs text-zinc-500">{workspaceName}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* QR Section */}
          <div className="flex flex-col items-center justify-center p-8 md:border-r border-zinc-800 gap-4">
            {loading ? (
              <div className="w-[220px] h-[220px] bg-zinc-800 rounded-2xl flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="w-[220px] h-[220px] bg-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 p-4 text-center">
                <p className="text-sm text-zinc-500">{error}</p>
                <button onClick={fetchQR} className="text-xs text-emerald-400 hover:text-emerald-300 underline">
                  Tentar novamente
                </button>
              </div>
            ) : qrCode ? (
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <Image src={qrCode} alt="QR Code WhatsApp" width={200} height={200} />
              </div>
            ) : null}

            {qrCode && !loading && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-zinc-500">
                  Expira em <span className="font-mono text-zinc-300">{mm}:{ss}</span>
                </span>
                <button onClick={fetchQR} className="text-zinc-600 hover:text-zinc-400 transition-colors ml-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Instructions Section */}
          <div className="flex-1 p-8">
            {/* OS Toggle */}
            <div className="flex gap-1 mb-6 bg-zinc-800 p-1 rounded-lg w-fit">
              <button
                onClick={() => setOs("android")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  os === "android"
                    ? "bg-zinc-700 text-zinc-100 shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                🤖 Android
              </button>
              <button
                onClick={() => setOs("iphone")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  os === "iphone"
                    ? "bg-zinc-700 text-zinc-100 shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                 iPhone
              </button>
            </div>

            {/* Steps */}
            <ol className="space-y-4">
              {(os === "android" ? STEPS_ANDROID : STEPS_IPHONE).map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p
                    className="text-sm text-zinc-400 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: step }}
                  />
                </li>
              ))}
            </ol>

            {/* Waiting indicator */}
            <div className="mt-8 flex items-center gap-2 text-xs text-zinc-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Aguardando conexão...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
