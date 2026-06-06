import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/services/conversation-processor";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, instance, data } = body;

    if (event === "CONNECTION_UPDATE") {
      const state = data?.state;
      await prisma.workspace.updateMany({
        where: { whatsappInstanceId: instance },
        data: {
          whatsappConnected: state === "open",
          whatsappPhone: data?.me?.id?.split(":")[0] ?? undefined,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (event === "MESSAGES_UPSERT") {
      const messages = Array.isArray(data?.messages) ? data.messages : [data];

      for (const msg of messages) {
        if (!msg?.key?.remoteJid) continue;

        const phone = msg.key.remoteJid.replace("@s.whatsapp.net", "");
        const isFromMe = msg.key.fromMe === true;
        const content =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          "[mídia]";

        const pushName = msg.pushName;
        const timestamp = new Date((msg.messageTimestamp ?? Date.now() / 1000) * 1000);

        await processMessage({
          workspaceId: "",
          phone,
          name: pushName,
          content,
          messageId: msg.key.id,
          timestamp,
          direction: isFromMe ? "outbound" : "inbound",
          instanceName: instance,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/evolution]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
