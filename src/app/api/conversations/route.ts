import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json([]);

  const conversations = await prisma.conversation.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { lastMessageAt: "desc" },
    take: 200,
    include: {
      funnelStage: true,
      trackableLink: { select: { id: true, name: true, slug: true } },
      _count: { select: { messages: true, pixelFires: true } },
    },
  });

  return NextResponse.json(conversations);
}
