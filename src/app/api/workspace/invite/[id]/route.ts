import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

// Revoga (cancela) um convite pendente — apenas o owner do workspace
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: session.user.id } },
  });
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Apenas o dono do workspace pode revogar convites" }, { status: 403 });
  }

  const invite = await prisma.workspaceInvite.findUnique({ where: { id } });
  if (!invite || invite.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  await prisma.workspaceInvite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
