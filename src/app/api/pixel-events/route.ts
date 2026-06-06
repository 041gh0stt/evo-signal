import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json([]);

  const events = await prisma.pixelEventConfig.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const body = await req.json();

  const event = await prisma.pixelEventConfig.create({
    data: {
      workspaceId: workspace.id,
      name: body.name,
      eventName: body.eventName,
      triggerType: body.triggerType,
      triggerValue: body.triggerValue || null,
      direction: body.direction ?? "inbound",
    },
  });

  return NextResponse.json(event, { status: 201 });
}
