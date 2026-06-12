import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MESSAGES_PAGE_SIZE = 50;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  // beforeId: ID da mensagem mais antiga já carregada — busca as 50 anteriores a ela
  const beforeId = searchParams.get("beforeId") ?? undefined;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      funnelStage: true,
      pixelFires: { orderBy: { firedAt: "desc" }, take: 10 },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Busca mais uma do que o necessário para saber se há mais páginas
  const rawMessages = await prisma.message.findMany({
    where: {
      conversationId: id,
      ...(beforeId
        ? { timestamp: { lt: (await prisma.message.findUnique({ where: { id: beforeId }, select: { timestamp: true } }))?.timestamp ?? new Date() } }
        : {}),
    },
    orderBy: { timestamp: "desc" },
    take: MESSAGES_PAGE_SIZE + 1,
  });

  const hasMore = rawMessages.length > MESSAGES_PAGE_SIZE;
  const messages = rawMessages.slice(0, MESSAGES_PAGE_SIZE).reverse(); // ordem cronológica

  return NextResponse.json({ ...conversation, messages, hasMore });
}
