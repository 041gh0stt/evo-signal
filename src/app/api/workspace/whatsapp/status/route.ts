import { NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstanceStatus, getInstanceInfo } from "@/services/evolution";
import { findMessages } from "@/services/evolution";
import { getActiveWorkspace } from "@/lib/workspace";

async function findChats(instanceName: string) {
  const res = await fetch(
    `${process.env.EVOLUTION_API_URL}/chat/findChats/${instanceName}`,
    {
      method: "POST",
      headers: { apikey: process.env.EVOLUTION_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }
  );
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function autoImport(instanceName: string, workspaceId: string) {
  try {
    const allChats = await findChats(instanceName);
    const individual = allChats
      .filter((c: Record<string, unknown>) => {
        const jid = (c.remoteJid as string) ?? "";
        return jid && !jid.includes("@g.us") && !jid.includes("@newsletter");
      })
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        new Date((b.updatedAt as string) ?? 0).getTime() - new Date((a.updatedAt as string) ?? 0).getTime()
      )
      .slice(0, 20);

    for (const chat of individual) {
      const remoteJid = chat.remoteJid as string;
      const phone = remoteJid.includes("@s.whatsapp.net")
        ? remoteJid.replace("@s.whatsapp.net", "")
        : `lid_${remoteJid.replace("@lid", "")}`;

      const pushName = (chat.pushName as string) ?? null;
      let messages: Record<string, unknown>[] = [];
      try { messages = await findMessages(instanceName, remoteJid, 50); } catch { /* continua */ }

      messages.sort((a, b) => ((a.messageTimestamp as number) ?? 0) - ((b.messageTimestamp as number) ?? 0));

      const firstTs = messages[0]
        ? new Date(((messages[0].messageTimestamp as number) > 1e10 ? (messages[0].messageTimestamp as number) : (messages[0].messageTimestamp as number) * 1000))
        : new Date();
      const lastTs = messages[messages.length - 1]
        ? new Date(((messages[messages.length - 1].messageTimestamp as number) > 1e10 ? (messages[messages.length - 1].messageTimestamp as number) : (messages[messages.length - 1].messageTimestamp as number) * 1000))
        : new Date();

      const conversation = await prisma.conversation.upsert({
        where: { workspaceId_phone: { workspaceId, phone } },
        create: { workspaceId, phone, name: pushName, origin: "untracked", firstMessageAt: firstTs, lastMessageAt: lastTs },
        update: { lastMessageAt: lastTs, ...(pushName && { name: pushName }) },
      });

      for (const msg of messages) {
        const key = msg.key as Record<string, unknown> | undefined;
        if (!key) continue;
        const messageObj = msg.message as Record<string, unknown> | undefined;
        const extText = messageObj?.extendedTextMessage as Record<string, unknown> | undefined;
        const content = (messageObj?.conversation as string) || (extText?.text as string) || "[mídia]";
        const tsRaw = msg.messageTimestamp as number | undefined;
        const timestamp = new Date(tsRaw ? (tsRaw > 1e10 ? tsRaw : tsRaw * 1000) : Date.now());
        try {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              messageId: (key.id as string) ?? `${phone}_${timestamp.getTime()}`,
              direction: key.fromMe === true ? "outbound" : "inbound",
              content,
              type: (msg.messageType as string) ?? "text",
              timestamp,
            },
          });
        } catch { /* duplicata, ignora */ }
      }
    }
  } catch (err) {
    console.error("[auto-import]", err);
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();

  if (!workspace?.whatsappInstanceId) {
    return NextResponse.json({ connected: false });
  }

  try {
    const status = await getInstanceStatus(workspace.whatsappInstanceId);
    const connected = status?.instance?.state === "open";

    if (connected) {
      let phone = workspace.whatsappPhone;
      try {
        const info = await getInstanceInfo(workspace.whatsappInstanceId);
        const ownerJid: string = info?.ownerJid ?? info?.instance?.ownerJid ?? "";
        if (ownerJid) phone = ownerJid.split("@")[0];
      } catch { /* fallback */ }

      const wasConnected = workspace.whatsappConnected;

      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { whatsappConnected: true, whatsappPhone: phone },
      });

      // Auto-importa 20 conversas na primeira vez que detecta conexão
      // Usa after() para garantir execução completa no Vercel após a resposta
      if (!wasConnected) {
        const instanceId = workspace.whatsappInstanceId;
        const wsId = workspace.id;
        after(async () => {
          await autoImport(instanceId, wsId);
        });
      }

      return NextResponse.json({ connected: true, phone });
    }

    if (workspace.whatsappConnected) {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { whatsappConnected: false },
      });
    }

    return NextResponse.json({ connected: false });
  } catch {
    // Falha ao contactar Evolution API (timeout, rede) — não assume desconectado,
    // retorna o último estado conhecido salvo no banco
    return NextResponse.json({
      connected: workspace.whatsappConnected ?? false,
      phone: workspace.whatsappPhone ?? undefined,
      stale: true, // indica que o status pode não estar atualizado
    });
  }
}
