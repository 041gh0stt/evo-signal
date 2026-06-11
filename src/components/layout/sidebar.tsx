"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MessageSquare, Link2,
  Settings, TrendingUp, LogOut, GitBranch,
  Users, FileText, X, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/conversations", icon: MessageSquare, label: "Conversas" },
  { href: "/funil", icon: GitBranch, label: "Jornada de Compra" },
  { href: "/links", icon: Link2, label: "Links Rastreáveis" },
  { href: "/pixel-log", icon: FileText, label: "Registro de Pixel" },
  { href: "/pixel-site", icon: Globe, label: "Pixel de Site" },
  { href: "/reports", icon: TrendingUp, label: "Relatórios" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

interface SidebarProps {
  /** Em telas pequenas, controla se o menu lateral está aberto como overlay */
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800">
        <Image
          src="/pingo-logo.png"
          alt="Pingo"
          width={1140}
          height={441}
          priority
          className="h-12 w-auto"
        />
        {/* Botão de fechar — só aparece no overlay mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar fixa — visível a partir de telas grandes (lg) */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-zinc-800 bg-zinc-900/50 shrink-0">
        {content}
      </aside>

      {/* Overlay mobile — abre por cima do conteúdo em telas pequenas */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          <aside className="relative w-64 max-w-[80vw] flex flex-col border-r border-zinc-800 bg-zinc-900 shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
