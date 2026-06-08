import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { deleteInstance } from "@/services/evolution";

// Apaga um workspace inteiro (e tudo em cascata: membros, links, conversas, instância do WhatsApp etc.)
// Acesso restrito ao painel /admin
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return NextResponse.json({ error: "Workspace não encontrado" }, { status: 404 });

  // Tenta remover a instância do WhatsApp na Evolution API antes de apagar
  if (workspace.whatsappInstanceId) {
    await deleteInstance(workspace.whatsappInstanceId).catch(() => {});
  }

  await prisma.workspace.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
