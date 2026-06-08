import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-100">Painel administrativo</h1>
          <p className="text-xs text-zinc-500">Visão geral de usuários e workspaces — Pingo</p>
        </div>
        <a href="/dashboard" className="text-sm text-emerald-400 hover:underline">
          Voltar ao app
        </a>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
