import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json([]);

  const stages = await prisma.funnelStage.findMany({
    where: { workspaceId: member.workspaceId },
    orderBy: { order: "asc" },
    include: { _count: { select: { conversations: true } } },
  });

  return NextResponse.json(stages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { name, color, pixelEventName, triggerKeyword, isSale, isFirstContact, purchaseValue } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const lastStage = await prisma.funnelStage.findFirst({
    where: { workspaceId: member.workspaceId },
    orderBy: { order: "desc" },
  });

  const stage = await prisma.funnelStage.create({
    data: {
      workspaceId: member.workspaceId,
      name: name.trim(),
      color: color ?? "#6b7280",
      order: (lastStage?.order ?? -1) + 1,
      pixelEventName: pixelEventName ?? null,
      triggerKeyword: triggerKeyword ?? null,
      isSale: isSale ?? false,
      isFirstContact: isFirstContact ?? false,
      purchaseValue: purchaseValue ?? null,
    },
    include: { _count: { select: { conversations: true } } },
  });

  return NextResponse.json(stage, { status: 201 });
}
