import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findMessages } from "@/services/evolution";
import { getActiveWorkspace } from "@/lib/workspace";

// Busca chats reais da instância
async function findChats(instanceName: string) {
  const res = await fetch(
    `${process.env.EVOLUTION_API_URL}/chat/findChats/${instanceName}`,
    {
      method: "POST",
      headers: {
        apikey: process.env.EVOLUTION_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const workspace = await getActiveWorkspace();

  if (!workspace?.whatsappInstanceId) {
    return new Response(JSON.stringify({ error: "WhatsApp não conectado" }), { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const contactLimit: number | null = body.limit ?? 50;
  const instanceName = workspace.whatsappInstanceId;
  const workspaceId = workspace.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        send({ type: "status", message: "Buscando conversas..." });

        const allChats = await findChats(instanceName);

        // Filtra somente conversas individuais (não grupos)
        const individualChats = allChats.filter((c: Record<string, unknown>) => {
          const jid = (c.remoteJid as string) ?? "";
          return jid && !jid.includes("@g.us") && !jid.includes("@newsletter");
        });

        // Ordena por data mais recente e aplica limite
        const sortedChats = individualChats
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
            const ta = new Date((a.updatedAt as string) ?? 0).getTime();
            const tb = new Date((b.updatedAt as string) ?? 0).getTime();
            return tb - ta;
          });

        const limitedChats = contactLimit ? sortedChats.slice(0, contactLimit) : sortedChats;
        const total = limitedChats.length;

        send({
          type: "status",
          message: `${individualChats.length} conversa(s) encontrada(s). Importando ${total}...`,
        });

        let importedConversations = 0;
        let importedMessages = 0;

        for (let i = 0; i < limitedChats.length; i++) {
          const chat = limitedChats[i] as Record<string, unknown>;
          const remoteJid = (chat.remoteJid as string) ?? "";
          if (!remoteJid) continue;

          // Para @lid: usa o ID numérico como identificador único
          // Para @s.whatsapp.net: usa o número real
          let phone: string;
          if (remoteJid.includes("@lid")) {
            phone = `lid_${remoteJid.replace("@lid", "")}`;
          } else {
            phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
          }

          const pushName = (chat.pushName as string) ?? null;
          const displayName = pushName ?? phone;

          send({
            type: "progress",
            current: i + 1,
            total,
            contact: displayName,
            importedConversations,
            importedMessages,
          });

          // Busca mensagens desta conversa
          let messages: Record<string, unknown>[] = [];
          try {
            messages = await findMessages(instanceName, remoteJid, 100);
          } catch {
            // Tenta criar a conversa mesmo sem mensagens (com base no lastMessage do chat)
            const lastMsg = chat.lastMessage as Record<string, unknown> | null;
            if (lastMsg) {
              const lastMsgKey = lastMsg.key as Record<string, unknown> | undefined;
              const lastMsgObj = lastMsg.message as Record<string, unknown> | undefined;
              messages = [{ key: lastMsgKey, message: lastMsgObj, pushName: lastMsg.pushName, messageTimestamp: lastMsg.messageTimestamp }];
            } else {
              continue;
            }
          }

          if (!messages.length) {
            // Sem mensagens: ainda cria a conversa com updatedAt do chat
            const updatedAt = new Date((chat.updatedAt as string) ?? Date.now());
            try {
              await prisma.conversation.upsert({
                where: { workspaceId_phone: { workspaceId, phone } },
                create: {
                  workspaceId,
                  phone,
                  name: pushName,
                  origin: "untracked",
                  firstMessageAt: updatedAt,
                  lastMessageAt: updatedAt,
                },
                update: {
                  lastMessageAt: updatedAt,
                  ...(pushName && { name: pushName }),
                },
              });
              importedConversations++;
            } catch { /* ignora */ }
            continue;
          }

          // Ordena por timestamp crescente
          messages.sort((a, b) => {
            const ta = (a.messageTimestamp as number) ?? 0;
            const tb = (b.messageTimestamp as number) ?? 0;
            return ta - tb;
          });

          // Garante que a conversa existe antes de inserir mensagens
          const firstTs = new Date(
            ((messages[0].messageTimestamp as number) ?? 0) > 1e10
              ? (messages[0].messageTimestamp as number)
              : ((messages[0].messageTimestamp as number) ?? 0) * 1000
          );
          const lastTs = new Date(
            ((messages[messages.length - 1].messageTimestamp as number) ?? 0) > 1e10
              ? (messages[messages.length - 1].messageTimestamp as number)
              : ((messages[messages.length - 1].messageTimestamp as number) ?? 0) * 1000
          );

          const conversation = await prisma.conversation.upsert({
            where: { workspaceId_phone: { workspaceId, phone } },
            create: {
              workspaceId,
              phone,
              name: pushName,
              origin: "untracked",
              firstMessageAt: firstTs,
              lastMessageAt: lastTs,
            },
            update: {
              lastMessageAt: lastTs,
              ...(pushName && { name: pushName }),
            },
          });

          // Insere mensagens
          for (const msg of messages) {
            const key = msg.key as Record<string, unknown> | undefined;
            if (!key) continue;

            const messageObj = msg.message as Record<string, unknown> | undefined;
            const extText = messageObj?.extendedTextMessage as Record<string, unknown> | undefined;
            const imageMsg = messageObj?.imageMessage as Record<string, unknown> | undefined;
            const videoMsg = messageObj?.videoMessage as Record<string, unknown> | undefined;

            const content: string =
              (messageObj?.conversation as string) ||
              (extText?.text as string) ||
              (imageMsg?.caption as string) ||
              (videoMsg?.caption as string) ||
              (messageObj?.audioMessage ? "[áudio]" : "") ||
              (messageObj?.stickerMessage ? "[sticker]" : "") ||
              (messageObj?.documentMessage ? "[documento]" : "") ||
              "[mídia]";

            const isFromMe = key.fromMe === true;
            const tsRaw = msg.messageTimestamp as number | undefined;
            const timestamp = new Date(
              tsRaw ? (tsRaw > 1e10 ? tsRaw : tsRaw * 1000) : Date.now()
            );
            const msgId = (key.id as string) ?? `${phone}_${timestamp.getTime()}`;

            try {
              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  messageId: msgId,
                  direction: isFromMe ? "outbound" : "inbound",
                  content,
                  type: (msg.messageType as string) ?? "text",
                  timestamp,
                },
              });
              importedMessages++;
            } catch {
              // ignora duplicata (messageId já existe)
            }
          }

          importedConversations++;
        }

        send({
          type: "done",
          importedConversations,
          importedMessages,
          message: `Importação concluída! ${importedConversations} conversa(s) e ${importedMessages} mensagem(s).`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[whatsapp/sync]", msg);
        send({ type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
