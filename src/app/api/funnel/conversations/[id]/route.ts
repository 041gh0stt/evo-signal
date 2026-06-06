import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fireConversionEvent } from "@/services/meta-pixel";

// Move conversa para um estágio do funil — dispara pixel se etapa tiver evento
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { funnelStageId } = await req.json();

  const conversation = await prisma.conversation.update({
    where: { id },
    data: { funnelStageId: funnelStageId ?? null },
    include: { workspace: true },
  });

  // Se a etapa tem um evento de pixel vinculado, dispara automaticamente
  if (funnelStageId && conversation.workspace.metaPixelId && conversation.workspace.metaAccessToken) {
    const stage = await prisma.funnelStage.findUnique({ where: { id: funnelStageId } });

    if (stage?.pixelEventName) {
      const pixelFire = await prisma.pixelFire.create({
        data: {
          conversationId: id,
          eventName: stage.pixelEventName,
          success: false,
        },
      });

      try {
        await fireConversionEvent({
          eventName: stage.pixelEventName,
          eventId: pixelFire.eventId,
          eventTime: Math.floor(Date.now() / 1000),
          phone: conversation.phone,
          pixelId: conversation.workspace.metaPixelId,
          accessToken: conversation.workspace.metaAccessToken,
          testEventCode: conversation.workspace.metaTestEventCode ?? undefined,
          customData: {
            funnel_stage: stage.name,
            // Purchase exige value + currency obrigatoriamente (Meta API)
            ...(stage.pixelEventName === "Purchase"
              ? { value: Number(stage.purchaseValue ?? 0), currency: "BRL" }
              : {}),
          },
        });

        await prisma.pixelFire.update({
          where: { id: pixelFire.id },
          data: { success: true },
        });

        // Aumenta lead score
        await prisma.conversation.update({
          where: { id },
          data: { leadScore: { increment: 15 } },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        await prisma.pixelFire.update({
          where: { id: pixelFire.id },
          data: { success: false, errorMessage: msg },
        });
      }
    }
  }

  return NextResponse.json(conversation);
}
