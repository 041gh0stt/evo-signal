import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json([]);

  const p = req.nextUrl.searchParams;
  const page  = Math.max(1, parseInt(p.get("page")  ?? "1",  10) || 1);
  const limit = Math.min(200, parseInt(p.get("limit") ?? "50", 10) || 50);
  const origin = p.get("origin") ?? undefined;

  const where = {
    workspaceId: workspace.id,
    ...(origin && origin !== "all" ? { origin } : {}),
  };

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      funnelStage: true,
      trackableLink: { select: { id: true, name: true, slug: true } },
      _count: { select: { messages: true, pixelFires: true } },
    },
  });

  return NextResponse.json(conversations);
}
