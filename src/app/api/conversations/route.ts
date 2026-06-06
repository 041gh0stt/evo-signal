import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json([]);

  const conversations = await prisma.conversation.findMany({
    where: { workspaceId: member.workspaceId },
    orderBy: { lastMessageAt: "desc" },
    take: 200,
    include: {
      funnelStage: true,
      _count: { select: { messages: true, pixelFires: true } },
    },
  });

  return NextResponse.json(conversations);
}
