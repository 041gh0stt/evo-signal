"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, FlaskConical, Loader2, CheckCircle2, XCircle } from "lucide-react";

type TestStatus = "idle" | "loading" | "ok" | "error";

export function PixelSiteClient({ snippet, workspaceId }: { snippet: string; workspaceId: string }) {
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMsg, setTestMsg] = useState("");

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleTest() {
    setTestStatus("loading");
    setTestMsg("");
    const fakeGclid = `pingo_test_${Date.now()}`;
    try {
      const res = await fetch(`/api/pixel/${workspaceId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "TestPixel",
          url: window.location.href,
          gclid: fakeGclid,
          utmSource: "google",
          utmMedium: "cpc",
          utmCampaign: "teste-pingo",
          customData: { test: true },
        }),
      });
      if (res.ok) {
        setTestStatus("ok");
        setTestMsg(`Evento recebido com gclid: ${fakeGclid}`);
      } else {
        const d = await res.json().catch(() => ({}));
        setTestStatus("error");
        setTestMsg(d.error ?? `Status ${res.status}`);
      }
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

      {/* Botão de teste */}
      <div className="pt-1 space-y-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={testStatus === "loading"}
          className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 gap-2"
        >
          {testStatus === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FlaskConical className="w-3.5 h-3.5 text-yellow-400" />
          )}
          Testar Pixel
        </Button>

        {testStatus === "ok" && (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">Pixel funcionando!</p>
              <p className="text-[11px] text-emerald-300/70 mt-0.5">{testMsg}</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Verifique nos eventos abaixo o registro <span className="text-zinc-300">TestPixel</span> com badge <span className="text-yellow-400">Google Ads</span>.
              </p>
            </div>
          </div>
        )}

        {testStatus === "error" && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-400">Erro ao testar pixel</p>
              <p className="text-[11px] text-red-300/70 mt-0.5">{testMsg}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
