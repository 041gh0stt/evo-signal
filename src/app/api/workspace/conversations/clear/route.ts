import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  // Deleta todas as conversas do workspace (messages em cascata)
  const { count } = await prisma.conversation.deleteMany({
    where: { workspaceId: member.workspaceId },
  });

  return NextResponse.json({ ok: true, deleted: count });
}
