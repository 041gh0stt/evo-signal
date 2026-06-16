import { prisma } from "@/lib/prisma";
import { fireConversionEvent } from "./meta-pixel";

// Busca nome da campanha, conjunto e anúncio na Graph API do Meta usando o adSourceId
async function fetchMetaAdDetails(adId: string, accessToken: string): Promise<{ adCampaignName?: string; adSetName?: string; adName?: string }> {
  try {
    const url = `https://graph.facebook.com/v19.0/${adId}?fields=name,adset%7Bname%7D,campaign%7Bname%7D&access_token=${accessToken}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[fetchMetaAdDetails] Graph API ${res.status} para adId=${adId}: ${errBody.slice(0, 300)}`);
      return {};
    }
    const data = await res.json() as { name?: string; adset?: { name?: string }; campaign?: { name?: string } };
    return {
      adName: data.name ?? undefined,
      adSetName: data.adset?.name ?? undefined,
      adCampaignName: data.campaign?.name ?? undefined,
    };
  } catch (err) {
    console.error(`[fetchMetaAdDetails] erro para adId=${adId}:`, err instanceof Error ? err.message : err);
    return {};
  }
}

interface AdReferral {
  sourceId: string | null;
  title: string | null;
  body: string | null;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
  ctwaClid: string | null;
  isMetaAd?: boolean;
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

interface StageLike {
  id: string;
  name: string;
  pixelEventName: string | null;
  purchaseValue: number | null;
}

// Move a conversa para a etapa informada e dispara o evento de pixel vinculado (se houver)
async function moveToFunnelStage(params: {
  conversationId: string;
  conversationName: string | null;
  stage: StageLike;
  workspace: { metaPixelId: string | null; metaAccessToken: string | null; metaTestEventCode: string | null };
  phone: string;
  timestamp: Date;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbc?: string | null;
}) {
  const { conversationId, conversationName, stage, workspace, phone, timestamp, clientIp, clientUserAgent, fbc } = params;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { funnelStageId: stage.id },
  });

  if (stage.pixelEventName && workspace.metaPixelId && workspace.metaAccessToken) {
    const pixelFire = await prisma.pixelFire.create({
      data: { conversationId, eventName: stage.pixelEventName, success: false },
    });
    try {
      await fireConversionEvent({
        eventName: stage.pixelEventName,
        eventId: pixelFire.eventId,
        eventTime: Math.floor(timestamp.getTime() / 1000),
        phone,
        name: conversationName,
        pixelId: workspace.metaPixelId,
        accessToken: workspace.metaAccessToken,
        testEventCode: workspace.metaTestEventCode ?? undefined,
        clientIp, clientUserAgent, fbc,
        customData: {
          funnel_stage: stage.name,
          // Purchase exige value + currency como número (Meta API rejeita Decimal/string)
          ...(stage.pixelEventName === "Purchase"
            ? { value: Number(stage.purchaseValue ?? 0), currency: "BRL" }
            : {}),
        },
      });
      await prisma.pixelFire.update({ where: { id: pixelFire.id }, data: { success: true } });
      await prisma.conversation.update({ where: { id: conversationId }, data: { leadScore: { increment: 15 } } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.pixelFire.update({ where: { id: pixelFire.id }, data: { errorMessage: message } });
    }
  }
}

export async function processMessage(msg: InboundMessage) {
  console.log(`[processMessage] instanceName=${msg.instanceName} phone=${msg.phone} dir=${msg.direction} content="${msg.content.slice(0, 40)}"`);

  const workspace = await prisma.workspace.findFirst({
    where: { whatsappInstanceId: msg.instanceName },
    include: {
      pixelEvents: { where: { active: true } },
      funnelStages: {
        where: { OR: [{ triggerKeyword: { not: null } }, { isFirstContact: true }] },
        orderBy: { order: "asc" },
        select: { id: true, name: true, pixelEventName: true, triggerKeyword: true, purchaseValue: true, isFirstContact: true },
      },
      trackableLinks: {
        where: { welcomeMessage: { not: null } },
        select: { id: true, welcomeMessage: true, utmSource: true, utmMedium: true, utmCampaign: true, utmContent: true, lastClickIp: true, lastClickUserAgent: true, lastClickFbc: true, lastClickGclid: true, lastClickAt: true },
      },
    },
  });

  if (!workspace) {
    console.log(`[processMessage] NO WORKSPACE found for instanceName=${msg.instanceName}`);
    return;
  }
  console.log(`[processMessage] workspace=${workspace.id} (${workspace.name})`);

  // Verifica se esse contato já existia antes dessa mensagem — usado para detectar
  // o "primeiro contato" e mover a conversa automaticamente pra etapa correspondente
  const existingConversation = await prisma.conversation.findUnique({
    where: { workspaceId_phone: { workspaceId: workspace.id, phone: msg.phone } },
    select: { id: true },
  });
  const isNewContact = !existingConversation;

  // Tenta identificar se a mensagem veio através de um Link Rastreável: o WhatsApp
  // pré-preenche o texto com a "mensagem de boas-vindas" cadastrada no link, então
  // comparamos o conteúdo recebido com as mensagens de boas-vindas dos links do workspace.
  const contentNorm = normalizeText(msg.content);
  const matchedLink =
    msg.direction === "inbound" && contentNorm.length > 4
      ? workspace.trackableLinks.find((l) => l.welcomeMessage && normalizeText(l.welcomeMessage) === contentNorm)
      : undefined;

  // Mensagens automáticas de saudação dos anúncios de mensagem do Meta (cadastradas nas
  // Configurações). Todo lead que clica num anúncio de mensagem envia exatamente esse texto,
  // então é uma detecção determinística mesmo quando a Evolution API não manda o adReferral.
  const adGreetings = (workspace.metaAdMessages ?? "")
    .split(/\n+/)
    .map((g) => normalizeText(g))
    .filter((g) => g.length > 4);
  const matchesAdGreeting =
    msg.direction === "inbound" &&
    contentNorm.length > 4 &&
    adGreetings.some((g) => contentNorm === g || contentNorm.includes(g));

  // Determina a origem do lead no momento da criação da conversa, em ordem de prioridade.
  function buildOriginData(): Record<string, unknown> {
    // 1. Anúncio do Meta detectado pelo Baileys (Clique p/ WhatsApp, ctwaClid ou sinais de conversão)
    if (msg.adReferral && (msg.adReferral.isMetaAd || msg.adReferral.sourceId || msg.adReferral.title || msg.adReferral.body || msg.adReferral.sourceUrl || msg.adReferral.ctwaClid)) {
      return {
        origin: "meta_ads",
        adSourceId: msg.adReferral.sourceId ?? msg.adReferral.ctwaClid ?? null,
        adTitle: msg.adReferral.title,
        adBody: msg.adReferral.body,
        adSourceUrl: msg.adReferral.sourceUrl,
        adThumbnailUrl: msg.adReferral.thumbnailUrl,
      };
    }
    // 2. Link Rastreável (herda UTMs e deduz origem)
    if (matchedLink) {
      const clickIsRecent = matchedLink.lastClickAt
        ? Date.now() - matchedLink.lastClickAt.getTime() < 10 * 60 * 1000
        : false;
      return {
        origin: deriveOriginFromUtm(matchedLink.utmSource, matchedLink.utmMedium),
        trackableLinkId: matchedLink.id,
        utmSource: matchedLink.utmSource,
        utmMedium: matchedLink.utmMedium,
        utmCampaign: matchedLink.utmCampaign,
        ...(clickIsRecent && {
          clientIp: matchedLink.lastClickIp,
          clientUserAgent: matchedLink.lastClickUserAgent,
          fbc: matchedLink.lastClickFbc,
          gclid: matchedLink.lastClickGclid,
        }),
      };
    }
    // 3. Mensagem-padrão de anúncio de mensagem do Meta (configurada pelo usuário)
    if (matchesAdGreeting) {
      return { origin: "meta_ads", adTitle: "Anúncio de mensagem do Meta" };
    }
    return {};
  }

  // 4. WhatsAppClick recente do Pixel de Site (capturado pelo pingo-pixel.js na landing page)
  // Só considera cliques dos últimos 5 min e ainda não atribuídos a outra conversa,
  // eliminando o risco de atribuir o mesmo clique a dois leads diferentes.
  async function getPixelClickOrigin(): Promise<Record<string, unknown>> {
    if (msg.direction !== "inbound") return {};
    const since = new Date(Date.now() - 5 * 60 * 1000);
    const click = await prisma.sitePixelEvent.findFirst({
      where: { workspaceId: workspace!.id, eventName: "WhatsAppClick", createdAt: { gte: since }, attributedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, utmSource: true, utmMedium: true, utmCampaign: true, gclid: true, fbc: true, fbclid: true },
    });
    if (!click) return {};
    const origin = deriveOriginFromUtm(click.utmSource, click.utmMedium);
    if (origin === "untracked") return {};
    // Marca como usado para não ser atribuído a outra conversa
    await prisma.sitePixelEvent.update({ where: { id: click.id }, data: { attributedAt: new Date() } });
    return {
      origin,
      utmSource: click.utmSource,
      utmMedium: click.utmMedium,
      utmCampaign: click.utmCampaign,
      gclid: click.gclid,
      fbc: click.fbc ?? (click.fbclid ? `fb.1.${Date.now()}.${click.fbclid}` : null),
    };
  }

  const baseOrigin = buildOriginData();
  const originData = Object.keys(baseOrigin).length > 0 ? baseOrigin : await getPixelClickOrigin();

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
      ...originData,
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

  // Conversa nova vinda de anúncio: busca nome de campanha/conjunto/anúncio na Graph API do Meta.
  // PRECISA ser awaited — em serverless (Vercel) promises não-aguardadas são mortas quando a
  // resposta do webhook é enviada, então um .then() solto nunca chega a salvar os dados.
  // Usa metaUserToken (OAuth do usuário, tem ads_read) e não metaAccessToken (Conversions API).
  const adReadToken = workspace.metaUserToken ?? workspace.metaAccessToken;
  if (isNewContact && conversation.adSourceId && adReadToken) {
    const details = await fetchMetaAdDetails(conversation.adSourceId, adReadToken);
    if (details.adCampaignName || details.adSetName || details.adName) {
      await prisma.conversation.update({ where: { id: conversation.id }, data: details });
      console.log(`[processMessage] Meta ad details: campanha="${details.adCampaignName}" anuncio="${details.adName}"`);
    } else {
      console.log(`[processMessage] Meta ad details VAZIO para adSourceId=${conversation.adSourceId}`);
    }
  }

  // ── 1. Primeiro contato: contato novo cai automaticamente na etapa marcada
  // como "Primeiro Contato" e dispara o evento (Contact, por padrão) ──────────
  const firstContactStage = workspace.funnelStages.find((s) => s.isFirstContact);
  let movedByFirstContact = false;

  // Dados de contexto do clique para enriquecer os eventos do pixel
  const clickContext = {
    clientIp: conversation.clientIp ?? undefined,
    clientUserAgent: conversation.clientUserAgent ?? undefined,
    fbc: conversation.fbc ?? undefined,
    gclid: conversation.gclid ?? undefined,
  };

  if (isNewContact && msg.direction === "inbound" && firstContactStage && conversation.funnelStageId !== firstContactStage.id) {
    await moveToFunnelStage({
      conversationId: conversation.id,
      conversationName: conversation.name,
      stage: firstContactStage,
      workspace,
      phone: msg.phone,
      timestamp: msg.timestamp,
      ...clickContext,
    });
    movedByFirstContact = true;
  }

  // ── 2. Verifica frases-gatilho das demais etapas da jornada ────────────────
  for (const stage of workspace.funnelStages) {
    if (stage.isFirstContact) continue; // já tratada acima
    if (!stage.triggerKeyword) continue;

    const keywords = stage.triggerKeyword.split(/[\n,]+/).map((k) => normalizeText(k.trim())).filter(Boolean);
    const matches = keywords.some((kw) => contentNorm.includes(kw));

    if (!matches) continue;
    if (conversation.funnelStageId === stage.id || (movedByFirstContact && firstContactStage?.id === stage.id)) continue; // já nessa etapa

    await moveToFunnelStage({
      conversationId: conversation.id,
      conversationName: conversation.name,
      stage,
      workspace,
      phone: msg.phone,
      timestamp: msg.timestamp,
      ...clickContext,
    });

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
        ...clickContext,
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
