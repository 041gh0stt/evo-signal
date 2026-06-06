import { prisma } from "@/lib/prisma";
import { fireConversionEvent } from "./meta-pixel";

interface InboundMessage {
  workspaceId: string;
  phone: string;
  name?: string;
  content: string;
  messageId: string;
  timestamp: Date;
  direction: "inbound" | "outbound";
  instanceName: string;
}

export async function processMessage(msg: InboundMessage) {
  console.log(`[processMessage] instanceName=${msg.instanceName} phone=${msg.phone} dir=${msg.direction} content="${msg.content.slice(0, 40)}"`);

  const workspace = await prisma.workspace.findFirst({
    where: { whatsappInstanceId: msg.instanceName },
    include: {
      pixelEvents: { where: { active: true } },
      funnelStages: {
        where: { triggerKeyword: { not: null } },
        orderBy: { order: "asc" },
        select: { id: true, name: true, pixelEventName: true, triggerKeyword: true, purchaseValue: true },
      },
    },
  });

  if (!workspace) {
    console.log(`[processMessage] NO WORKSPACE found for instanceName=${msg.instanceName}`);
    return;
  }
  console.log(`[processMessage] workspace=${workspace.id} (${workspace.name})`);

  // Mensagens outbound (enviadas por você) só são salvas se já existe conversa com esse contato
  // Não cria conversa nova para mensagens que você enviou — só inbound cria
  if (msg.direction === "outbound") {
    const existing = await prisma.conversation.findUnique({
      where: { workspaceId_phone: { workspaceId: workspace.id, phone: msg.phone } },
      select: { id: true },
    });
    if (!existing) {
      console.log(`[processMessage] skipping outbound — no existing conv for phone=${msg.phone}`);
      return;
    }
  }

  // Upsert conversation
  const conversation = await prisma.conversation.upsert({
    where: { workspaceId_phone: { workspaceId: workspace.id, phone: msg.phone } },
    create: {
      workspaceId: workspace.id,
      phone: msg.phone,
      name: msg.name,
      firstMessageAt: msg.timestamp,
      lastMessageAt: msg.timestamp,
    },
    update: {
      lastMessageAt: msg.timestamp,
      ...(msg.name && { name: msg.name }),
    },
  });

  // Save message
  try {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        messageId: msg.messageId,
        direction: msg.direction,
        content: msg.content,
        timestamp: msg.timestamp,
      },
    });
    console.log(`[processMessage] message saved convId=${conversation.id} msgId=${msg.messageId}`);
  } catch (e: unknown) {
    // Ignora duplicata (messageId já existe), loga outros erros
    const code = (e as { code?: string })?.code;
    if (code !== "P2002") console.error(`[processMessage] message.create error:`, e);
  }

  const contentLower = msg.content.toLowerCase();

  // ── 1. Check funnel stage keywords ─────────────────────────────────
  for (const stage of workspace.funnelStages) {
    if (!stage.triggerKeyword) continue;

    const keywords = stage.triggerKeyword.split(/[\n,]+/).map((k) => k.trim().toLowerCase()).filter(Boolean);
    const matches = keywords.some((kw) => contentLower.includes(kw));

    if (!matches) continue;
    if (conversation.funnelStageId === stage.id) continue; // já nessa etapa

    // Move conversa para a etapa
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { funnelStageId: stage.id },
    });

    // Dispara pixel se a etapa tiver evento vinculado
    if (stage.pixelEventName && workspace.metaPixelId && workspace.metaAccessToken) {
      const pixelFire = await prisma.pixelFire.create({
        data: { conversationId: conversation.id, eventName: stage.pixelEventName, success: false },
      });
      try {
        await fireConversionEvent({
          eventName: stage.pixelEventName,
          eventId: pixelFire.eventId,
          eventTime: Math.floor(msg.timestamp.getTime() / 1000),
          phone: msg.phone,
          pixelId: workspace.metaPixelId,
          accessToken: workspace.metaAccessToken,
          testEventCode: workspace.metaTestEventCode ?? undefined,
          customData: {
            funnel_stage: stage.name,
            ...(stage.pixelEventName === "Purchase" && stage.purchaseValue
              ? { value: stage.purchaseValue, currency: "BRL" }
              : {}),
          },
        });
        await prisma.pixelFire.update({ where: { id: pixelFire.id }, data: { success: true } });
        await prisma.conversation.update({ where: { id: conversation.id }, data: { leadScore: { increment: 15 } } });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.pixelFire.update({ where: { id: pixelFire.id }, data: { errorMessage: message } });
      }
    }

    break; // só aplica a primeira etapa que bater
  }

  if (!workspace.metaPixelId || !workspace.metaAccessToken) return;

  // ── 2. Check pixel event configs (keyword/first_message triggers) ──
  for (const config of workspace.pixelEvents) {
    const matchesDirection = config.direction === "both" || config.direction === msg.direction;
    if (!matchesDirection) continue;

    let shouldFire = false;

    if (config.triggerType === "keyword" && config.triggerValue) {
      shouldFire = contentLower.includes(config.triggerValue.toLowerCase());
    } else if (config.triggerType === "first_message") {
      const msgCount = await prisma.message.count({ where: { conversationId: conversation.id } });
      shouldFire = msgCount === 1;
    }

    if (!shouldFire) continue;

    // Dedup: não dispara o mesmo evento para a mesma conversa duas vezes em 24h
    const recentFire = await prisma.pixelFire.findFirst({
      where: {
        conversationId: conversation.id,
        eventConfigId: config.id,
        firedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        success: true,
      },
    });
    if (recentFire) continue;

    const pixelFire = await prisma.pixelFire.create({
      data: { conversationId: conversation.id, eventConfigId: config.id, eventName: config.eventName, success: false },
    });

    try {
      await fireConversionEvent({
        eventName: config.eventName,
        eventId: pixelFire.eventId,
        eventTime: Math.floor(msg.timestamp.getTime() / 1000),
        phone: msg.phone,
        pixelId: workspace.metaPixelId,
        accessToken: workspace.metaAccessToken,
        testEventCode: workspace.metaTestEventCode ?? undefined,
        customData: { utm_source: conversation.utmSource ?? undefined },
      });
      await prisma.pixelFire.update({ where: { id: pixelFire.id }, data: { success: true } });
      await prisma.conversation.update({ where: { id: conversation.id }, data: { leadScore: { increment: 10 } } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.pixelFire.update({ where: { id: pixelFire.id }, data: { errorMessage: message } });
    }
  }
}
