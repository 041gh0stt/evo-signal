import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

// Remove um membro do workspace ativo — apenas o owner, e não pode remover a si mesmo
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: session.user.id } },
  });
  if (!requester || requester.role !== "owner") {
    return NextResponse.json({ error: "Apenas o dono do workspace pode remover membros" }, { status: 403 });
  }

  const target = await prisma.workspaceMember.findUnique({ where: { id } });
  if (!target || target.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }
  if (target.userId === session.user.id) {
    return NextResponse.json({ error: "Você não pode remover a si mesmo" }, { status: 400 });
  }

  await prisma.workspaceMember.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
