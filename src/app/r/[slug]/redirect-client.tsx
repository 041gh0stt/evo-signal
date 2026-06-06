"use client";

import { useEffect } from "react";

interface Props {
  title: string;
  message: string;
  delay: number;
  url: string;
}

export function RedirectClient({ title, message, delay, url }: Props) {
  useEffect(() => {
    const t = setTimeout(() => { window.location.href = url; }, delay * 1000);
    return () => clearTimeout(t);
  }, [url, delay]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-sm w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-emerald-400 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.112 1.528 5.836L.057 23.999l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.727.977.994-3.634-.235-.374A9.818 9.818 0 1112 21.818z"/>
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold text-zinc-100">{title}</h1>
          <p className="text-sm text-zinc-400 mt-2">{message}</p>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ animation: `grow ${delay}s linear forwards`, width: "0%" }}
            />
          </div>
          <p className="text-xs text-zinc-600">Redirecionando em {delay} segundos...</p>
        </div>

        <a
          href={url}
          className="inline-block text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Clique aqui se não for redirecionado →
        </a>
      </div>

      <style>{`
        @keyframes grow { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  );
}
