import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  // Deleta todas as conversas do workspace (messages em cascata)
  const { count } = await prisma.conversation.deleteMany({
    where: { workspaceId: workspace.id },
  });

  return NextResponse.json({ ok: true, deleted: count });
}
