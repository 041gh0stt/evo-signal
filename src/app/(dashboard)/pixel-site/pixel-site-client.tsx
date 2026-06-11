"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function PixelSiteClient({ snippet, workspaceId }: { snippet: string; workspaceId: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-3">
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
    </div>
  );
}
