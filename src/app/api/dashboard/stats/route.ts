import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const days = parseInt(searchParams.get("days") ?? "7");

  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalConversations, trackedConversations, pixelFires, originBreakdown] =
    await Promise.all([
      prisma.conversation.count({ where: { workspaceId, createdAt: { gte: since } } }),
      prisma.conversation.count({
        where: { workspaceId, createdAt: { gte: since }, NOT: { origin: "untracked" } },
      }),
      prisma.pixelFire.count({
        where: {
          conversation: { workspaceId },
          firedAt: { gte: since },
          success: true,
        },
      }),
      prisma.conversation.groupBy({
        by: ["origin"],
        where: { workspaceId, createdAt: { gte: since } },
        _count: true,
      }),
    ]);

  return NextResponse.json({
    totalConversations,
    trackedConversations,
    untrackedConversations: totalConversations - trackedConversations,
    trackedRate: totalConversations > 0 ? (trackedConversations / totalConversations) * 100 : 0,
    pixelFires,
    originBreakdown,
  });
}
