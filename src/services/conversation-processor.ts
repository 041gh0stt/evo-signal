import { prisma } from "@/lib/prisma";
import { fireConversionEvent } from "./meta-pixel";

interface AdReferral {
  sourceId: string | null;
  title: string | null;
  body: string | null;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
}

interface InboundMessage {
  workspaceId: string;
  phone: string;
  name?: string;
  content: string;
  messageId: string;
  timestamp: Date;
  direction: "inbound" | "outbound";
  instanceName: string;
  adReferral?: AdReferral | null;
}

// Normaliza texto: minúsculo + sem acentos, pra comparar mensagens com flexibilidade
function normalizeText(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Deduz a origem (meta_ads, google_ads, organic) a partir dos UTMs configurados no link rastreável
function deriveOriginFromUtm(utmSource?: string | null, utmMedium?: string | null): string {
  const source = normalizeText(utmSource ?? "");
  const medium = normalizeText(utmMedium ?? "");
  if (/meta|facebook|fb|instagram|ig/.test(source)) return "meta_ads";
  if (/google|adwords|gads|youtube/.test(source)) return "google_ads";
  if (source || medium) return "organic";
  return "untracked";
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
      trackableLinks: {
        where: { welcomeMessage: { not: null } },
        select: { id: true, welcomeMessage: true, utmSource: true, utmMedium: true, utmCampaign: true, utmContent: true },
      },
    },
  });

  if (!workspace) {
    console.log(`[processMessage] NO WORKSPACE found for instanceName=${msg.instanceName}`);
    return;
  }
  console.log(`[processMessage] workspace=${workspace.id} (${workspace.name})`);

  // Tenta identificar se a mensagem veio através de um Link Rastreável: o WhatsApp
  // pré-preenche o texto com a "mensagem de boas-vindas" cadastrada no link, então
  // comparamos o conteúdo recebido com as mensagens de boas-vindas dos links do workspace.
  const contentNorm = normalizeText(msg.content);
  const matchedLink =
    msg.direction === "inbound" && contentNorm.length > 4
      ? workspace.trackableLinks.find((l) => l.welcomeMessage && normalizeText(l.welcomeMessage) === contentNorm)
      : undefined;

  // Upsert conversation — cria para inbound E outbound
  // Para outbound, não usa pushName (seria seu próprio nome, não o do contato)
  const conversation = await prisma.conversation.upsert({
    where: { workspaceId_phone: { workspaceId: workspace.id, phone: msg.phone } },
    create: {
      workspaceId: workspace.id,
      phone: msg.phone,
      // Inbound: pushName é o contato. Outbound: não tem nome confiável, deixa null
      name: msg.direction === "inbound" ? (msg.name ?? null) : null,
      firstMessageAt: msg.timestamp,
      lastMessageAt: msg.timestamp,
      // Se a primeira mensagem veio de um anúncio "Clique para o WhatsApp" (Meta Ads),
      // marca a origem e guarda os dados do criativo para exibição posterior
      ...(msg.adReferral?.sourceId
        ? {
            origin: "meta_ads",
            adSourceId: msg.adReferral.sourceId,
            adTitle: msg.adReferral.title,
            adBody: msg.adReferral.body,
            adSourceUrl: msg.adReferral.sourceUrl,
            adThumbnailUrl: msg.adReferral.thumbnailUrl,
          }
        // Senão, se identificamos que veio de um Link Rastreável, herda os UTMs
        // configurados nele e deduz a origem (ex: meta_ads se o UTM source for meta/facebook/instagram)
        : matchedLink
          ? {
              origin: deriveOriginFromUtm(matchedLink.utmSource, matchedLink.utmMedium),
              trackableLinkId: matchedLink.id,
              utmSource: matchedLink.utmSource,
              utmMedium: matchedLink.utmMedium,
              utmCampaign: matchedLink.utmCampaign,
            }
          : {}),
    },
    update: {
      lastMessageAt: msg.timestamp,
      // Só atualiza o nome com mensagens inbound — outbound traz seu próprio nome
      ...(msg.direction === "inbound" && msg.name && { name: msg.name }),
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

  // ── 1. Check funnel stage keywords ─────────────────────────────────
  for (const stage of workspace.funnelStages) {
    if (!stage.triggerKeyword) continue;

    const keywords = stage.triggerKeyword.split(/[\n,]+/).map((k) => normalizeText(k.trim())).filter(Boolean);
    const matches = keywords.some((kw) => contentNorm.includes(kw));

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
          name: conversation.name,
          pixelId: workspace.metaPixelId,
          accessToken: workspace.metaAccessToken,
          testEventCode: workspace.metaTestEventCode ?? undefined,
          customData: {
            funnel_stage: stage.name,
            // Purchase exige value + currency como número (Meta API rejeita Decimal/string)
            ...(stage.pixelEventName === "Purchase"
              ? { value: Number(stage.purchaseValue ?? 0), currency: "BRL" }
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
      shouldFire = contentNorm.includes(normalizeText(config.triggerValue));
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
        name: conversation.name,
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
