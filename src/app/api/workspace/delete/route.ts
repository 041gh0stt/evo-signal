import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await req.json();
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  // Verifica que o usuário é dono do workspace
  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId, role: "owner" },
    include: { workspace: true },
  });

  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Conta quantos workspaces o usuário tem — não pode apagar o último
  const totalWorkspaces = await prisma.workspaceMember.count({
    where: { userId: session.user.id },
  });
  if (totalWorkspaces <= 1) {
    return NextResponse.json({ error: "Você precisa ter ao menos uma conta" }, { status: 400 });
  }

  // Deleta tudo em cascata (Prisma faz via onDelete: Cascade no schema)
  await prisma.workspace.delete({ where: { id: workspaceId } });

  return NextResponse.json({ ok: true });
}
