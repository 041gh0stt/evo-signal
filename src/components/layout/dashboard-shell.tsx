"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface Workspace {
  id: string;
  name: string;
  whatsappConnected: boolean;
  whatsappPhone: string | null;
  role: string;
}

interface Props {
  activeWorkspace: Workspace;
  allWorkspaces: Workspace[];
  children: React.ReactNode;
}

// Componente client que orquestra sidebar + header + conteúdo, controlando
// a abertura/fechamento do menu lateral em telas pequenas (mobile).
export function DashboardShell({ activeWorkspace, allWorkspaces, children }: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          activeWorkspace={activeWorkspace}
          allWorkspaces={allWorkspaces}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
