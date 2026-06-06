import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json([]);

  const events = await prisma.pixelEventConfig.findMany({
    where: { workspaceId: member.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const body = await req.json();

  const event = await prisma.pixelEventConfig.create({
    data: {
      workspaceId: member.workspaceId,
      name: body.name,
      eventName: body.eventName,
      triggerType: body.triggerType,
      triggerValue: body.triggerValue || null,
      direction: body.direction ?? "inbound",
    },
  });

  return NextResponse.json(event, { status: 201 });
}
