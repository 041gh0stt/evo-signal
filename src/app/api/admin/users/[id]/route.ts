import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { deleteInstance } from "@/services/evolution";

// Apaga um usuário. Se ele for o único "owner" de algum workspace, esse workspace
// (e tudo dentro dele, incluindo a instância do WhatsApp) também é removido.
// Acesso restrito ao painel /admin
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: "Você não pode apagar a sua própria conta por aqui" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { workspaces: { include: { workspace: { include: { _count: { select: { members: true } } } } } } },
  });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  // Workspaces nos quais esse usuário é dono E o único membro -> apagar o workspace inteiro
  const workspacesToDelete = user.workspaces.filter(
    (m) => m.role === "owner" && m.workspace._count.members === 1
  );

  for (const m of workspacesToDelete) {
    if (m.workspace.whatsappInstanceId) {
      await deleteInstance(m.workspace.whatsappInstanceId).catch(() => {});
    }
  }

  await prisma.$transaction([
    ...workspacesToDelete.map((m) => prisma.workspace.delete({ where: { id: m.workspaceId } })),
    prisma.user.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true, deletedWorkspaces: workspacesToDelete.length });
}
