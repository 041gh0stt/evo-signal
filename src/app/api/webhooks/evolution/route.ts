import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/services/conversation-processor";
import { prisma } from "@/lib/prisma";

function extractPhone(remoteJid: string): string {
  // @s.whatsapp.net → número real
  if (remoteJid.includes("@s.whatsapp.net")) {
    return remoteJid.replace("@s.whatsapp.net", "");
  }
  // @lid → identificador privado, usa prefixo lid_
  if (remoteJid.includes("@lid")) {
    return `lid_${remoteJid.replace("@lid", "")}`;
  }
  // @c.us → fallback
  return remoteJid.replace("@c.us", "");
}

interface AdReferral {
  sourceId: string | null;
  title: string | null;
  body: string | null;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
  ctwaClid: string | null;
}

// Percorre RECURSIVAMENTE o objeto procurando os sinais de anúncio do Meta em
// qualquer nível, já que a Evolution API v2 posiciona o externalAdReplyInfo /
// ctwaClid em lugares diferentes dependendo do tipo de mensagem e da versão.
// - externalAdReplyInfo: dados do criativo (título, corpo, thumbnail) — anúncio "Clique para WhatsApp"
// - ctwaClid: Click-To-WhatsApp click id — presente em todo lead de anúncio de mensagem, mesmo sem o criativo
function collectAdInfo(
  obj: unknown,
  acc: { adReply?: Record<string, unknown>; ctwaClid?: string },
  depth = 0
): void {
  if (!obj || typeof obj !== "object" || depth > 8) return;
  if (Array.isArray(obj)) {
    for (const item of obj) collectAdInfo(item, acc, depth + 1);
    return;
  }
  const rec = obj as Record<string, unknown>;
  if (!acc.adReply && rec.externalAdReplyInfo && typeof rec.externalAdReplyInfo === "object") {
    acc.adReply = rec.externalAdReplyInfo as Record<string, unknown>;
  }
  if (!acc.ctwaClid && typeof rec.ctwaClid === "string" && rec.ctwaClid) {
    acc.ctwaClid = rec.ctwaClid;
  }
  for (const key in rec) {
    collectAdInfo(rec[key], acc, depth + 1);
  }
}

// Extrai dados do anúncio do Meta varrendo o objeto inteiro da mensagem (raw msg).
function extractAdReferral(rawMsg: Record<string, unknown> | null | undefined): AdReferral | null {
  if (!rawMsg) return null;
  const acc: { adReply?: Record<string, unknown>; ctwaClid?: string } = {};
  collectAdInfo(rawMsg, acc);
  if (!acc.adReply && !acc.ctwaClid) return null;
  const a = acc.adReply ?? {};
  return {
    sourceId: (a.sourceId as string) ?? null,
    title: (a.title as string) ?? null,
    body: (a.body as string) ?? null,
    sourceUrl: (a.sourceUrl as string) ?? null,
    thumbnailUrl: (a.thumbnailUrl as string) ?? null,
    ctwaClid: acc.ctwaClid ?? (a.ctwaClid as string) ?? null,
  };
}

function extractContent(message: Record<string, unknown> | null | undefined): string {
  if (!message) return "[mídia]";
  return (
    (message.conversation as string) ||
    ((message.extendedTextMessage as Record<string, unknown>)?.text as string) ||
    ((message.imageMessage as Record<string, unknown>)?.caption as string) ||
    ((message.videoMessage as Record<string, unknown>)?.caption as string) ||
    (message.audioMessage ? "[áudio]" : "") ||
    (message.stickerMessage ? "[sticker]" : "") ||
    (message.documentMessage ? "[documento]" : "") ||
    "[mídia]"
  );
}

// GET para verificação de saúde do webhook
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "evolution-webhook" });
}

export async function POST(req: NextRequest) {
  // Valida secret do webhook quando configurado (env EVOLUTION_WEBHOOK_SECRET).
  // A Evolution API envia o secret como header "apikey" ou "Authorization: Bearer <secret>".
  const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization") ?? req.headers.get("apikey") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (token !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();

    // Log completo para diagnóstico no Vercel (2000 chars)
    console.log("[webhook] RAW:", JSON.stringify(body).slice(0, 2000));

    const { event, instance, data } = body;
    // Evolution API v2 pode mandar instance como string ou objeto
    const instanceName = typeof instance === "string" ? instance : (instance?.instanceName ?? instance?.name ?? String(instance));
    // Normaliza evento: "messages.upsert" → "MESSAGES_UPSERT"
    const eventKey = (event as string ?? "").toUpperCase().replace(/\./g, "_");

    console.log(`[webhook] event=${event} eventKey=${eventKey} instanceName=${instanceName}`);

    if (eventKey === "CONNECTION_UPDATE") {
      const state = data?.state;
      const phone = data?.me?.id?.split(":")?.[0]?.split("@")?.[0] ?? undefined;
      await prisma.workspace.updateMany({
        where: { whatsappInstanceId: instanceName },
        data: {
          whatsappConnected: state === "open",
          ...(phone && { whatsappPhone: phone }),
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (eventKey === "MESSAGES_UPSERT") {
      // Evolution API v2 pode mandar: data = objeto único OU data.messages = array
      const messages = Array.isArray(data?.messages)
        ? data.messages
        : Array.isArray(data)
          ? data
          : [data];

      for (const msg of messages) {
        if (!msg?.key?.remoteJid) continue;

        const remoteJid: string = msg.key.remoteJid;

        // Ignora grupos
        if (remoteJid.includes("@g.us") || remoteJid.includes("@newsletter")) continue;

        const phone = extractPhone(remoteJid);
        const isFromMe = msg.key.fromMe === true;
        const content = extractContent(msg.message);
        // Varre o msg inteiro (key, message, contextInfo, etc.) atrás de sinais de anúncio do Meta
        const adReferral = extractAdReferral(msg);
        if (adReferral) console.log(`[webhook] adReferral DETECTADO=${JSON.stringify(adReferral)}`);
        const pushName = msg.pushName ?? null;
        const tsRaw = msg.messageTimestamp;
        const timestamp = new Date(
          typeof tsRaw === "number"
            ? (tsRaw > 1e10 ? tsRaw : tsRaw * 1000)
            : Date.now()
        );

        console.log(`[webhook] msg phone=${phone} fromMe=${isFromMe} content="${content.slice(0, 50)}"`);

        await processMessage({
          workspaceId: "",
          phone,
          name: pushName,
          content,
          messageId: msg.key.id ?? `${phone}_${timestamp.getTime()}`,
          timestamp,
          direction: isFromMe ? "outbound" : "inbound",
          instanceName,
          adReferral,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/evolution]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
