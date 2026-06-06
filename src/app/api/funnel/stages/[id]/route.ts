import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const stage = await prisma.funnelStage.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(stage);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Move conversations desse estágio para sem estágio
  await prisma.conversation.updateMany({
    where: { funnelStageId: id },
    data: { funnelStageId: null },
  });

  await prisma.funnelStage.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
