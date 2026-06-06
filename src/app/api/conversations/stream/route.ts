import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const workspace = await getActiveWorkspace();
  if (!workspace) return new Response("No workspace", { status: 404 });

  const workspaceId = workspace.id;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Envia heartbeat imediato para manter conexão aberta
      controller.enqueue(encoder.encode(": heartbeat\n\n"));

      // Olha 10s atrás para não perder mensagens salvas antes da conexão SSE abrir
      let lastCheck = new Date(Date.now() - 10_000);

      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }

        try {
          // Verifica se há mensagens novas desde a última checagem
          const newMessages = await prisma.message.findFirst({
            where: {
              conversation: { workspaceId },
              createdAt: { gt: lastCheck },
            },
            orderBy: { createdAt: "desc" },
            include: { conversation: { select: { id: true, phone: true, name: true } } },
          });

          if (newMessages) {
            lastCheck = new Date();
            const payload = JSON.stringify({
              type: "new_message",
              conversationId: newMessages.conversation.id,
              phone: newMessages.conversation.phone,
              name: newMessages.conversation.name,
            });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          } else {
            // Heartbeat a cada ciclo para manter conexão viva
            controller.enqueue(encoder.encode(": ping\n\n"));
          }
        } catch {
          // Banco pode estar lento, ignora
        }
      }, 5000); // checa a cada 5 segundos

      // Fecha quando o cliente desconecta
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
