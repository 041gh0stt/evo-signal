"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MessageSquare, Link2,
  Settings, TrendingUp, LogOut, GitBranch,
  Users, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/conversations", icon: MessageSquare, label: "Conversas" },
  { href: "/funil", icon: GitBranch, label: "Jornada de Compra" },
  { href: "/links", icon: Link2, label: "Links Rastreáveis" },
  { href: "/pixel-log", icon: FileText, label: "Registro de Pixel" },
  { href: "/reports", icon: TrendingUp, label: "Relatórios" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex flex-col border-r border-zinc-800 bg-zinc-900/50 shrink-0">
      {/* Logo */}
      <div className="flex items-center px-5 py-5 border-b border-zinc-800">
        <Image
          src="/pingo-logo.png"
          alt="Pingo"
          width={1140}
          height={441}
          priority
          className="h-9 w-auto"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
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
    </aside>
  );
}
