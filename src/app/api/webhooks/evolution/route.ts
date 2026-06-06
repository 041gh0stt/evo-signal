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
  try {
    const body = await req.json();

    // Log completo para diagnóstico no Vercel
    console.log("[webhook] RAW:", JSON.stringify(body).slice(0, 500));

    const { event, instance, data } = body;
    // Evolution API v2 pode mandar instance como string ou objeto
    const instanceName = typeof instance === "string" ? instance : (instance?.instanceName ?? instance?.name ?? String(instance));

    console.log(`[webhook] event=${event} instanceName=${instanceName}`);

    if (event === "CONNECTION_UPDATE") {
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

    if (event === "MESSAGES_UPSERT") {
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
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/evolution]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
