import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json([]);

  const { id } = await params;

  const conversations = await prisma.conversation.findMany({
    where: { trackableLinkId: id, workspaceId: workspace.id },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      funnelStage: { select: { name: true, color: true } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(conversations);
}
