import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Endpoint de diagnóstico — restrito a administradores
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Pega o primeiro workspace que tem instanceId (debug temporário)
  const ws = await prisma.workspace.findFirst({
    where: { whatsappInstanceId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  const instanceName = ws?.whatsappInstanceId;
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const result: Record<string, unknown> = {
    workspace: { id: ws?.id, name: ws?.name, instanceId: instanceName, connected: ws?.whatsappConnected },
    env: { apiUrl, appUrl, hasApiKey: !!apiKey },
  };

  if (!instanceName) {
    result.error = "whatsappInstanceId is NULL in database";
    return NextResponse.json(result);
  }

  // Checa status da instância na Evolution API
  try {
    const statusRes = await fetch(`${apiUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
      headers: { apikey: apiKey! },
    });
    result.instanceStatus = await statusRes.json();
  } catch (e) {
    result.instanceStatusError = String(e);
  }

  // Checa webhook configurado na instância
  try {
    const whRes = await fetch(`${apiUrl}/webhook/find/${instanceName}`, {
      headers: { apikey: apiKey! },
    });
    result.webhookConfig = await whRes.json();
  } catch (e) {
    result.webhookConfigError = String(e);
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
