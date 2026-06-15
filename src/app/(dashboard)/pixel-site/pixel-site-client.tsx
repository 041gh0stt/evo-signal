"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, FlaskConical, Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

type TestStatus = "idle" | "loading" | "ok" | "error" | "not_found";

export function PixelSiteClient({ snippet, workspaceId }: { snippet: string; workspaceId: string }) {
  const [copied, setCopied] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMsg, setTestMsg] = useState("");

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleVerify() {
    if (!siteUrl.trim()) return;
    setTestStatus("loading");
    setTestMsg("");

    let url = siteUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    try {
      const res = await fetch(
        `/api/pixel/${workspaceId}/verify?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setTestStatus("error");
        setTestMsg(data.error ?? "Erro ao verificar");
        return;
      }

      setTestStatus(data.found ? "ok" : "not_found");
      setTestMsg(data.detail ?? "");
    } catch (e) {
      setTestStatus("error");
      setTestMsg(e instanceof Error ? e.message : "Erro de rede");
    }
  }

  return (
    <div className="space-y-4">
      {/* ID do workspace */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Pixel ID:</span>
        <code className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded select-all">{workspaceId}</code>
      </div>

      {/* Snippet */}
      <div className="relative">
        <pre className="bg-zinc-950 rounded-lg p-3 text-[11px] text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
          {snippet}
        </pre>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="absolute top-2 right-2 h-7 px-2.5 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-xs gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copiar
            </>
          )}
        </Button>
      </div>

      {/* Verificador de instalação */}
      <div className="space-y-2 pt-1">
        <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5 text-yellow-400" />
          Verificar instalação na sua página
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={siteUrl}
            onChange={(e) => { setSiteUrl(e.target.value); setTestStatus("idle"); }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="https://seusite.com.br"
            className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            size="sm"
            onClick={handleVerify}
            disabled={testStatus === "loading" || !siteUrl.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shrink-0"
          >
            {testStatus === "loading" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5" />
            )}
            {testStatus === "loading" ? "Verificando..." : "Verificar"}
          </Button>
        </div>

        {testStatus === "ok" && (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">Pixel instalado corretamente!</p>
              <p className="text-[11px] text-emerald-300/70 mt-0.5">{testMsg}</p>
            </div>
          </div>
        )}

        {testStatus === "not_found" && (
          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5">
            <XCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-yellow-400">Pixel não encontrado</p>
              <p className="text-[11px] text-yellow-300/70 mt-0.5">{testMsg}</p>
            </div>
          </div>
        )}

        {testStatus === "error" && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-400">Erro ao verificar</p>
              <p className="text-[11px] text-red-300/70 mt-0.5">{testMsg}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
