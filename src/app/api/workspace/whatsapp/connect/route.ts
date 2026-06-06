import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInstance, getQRCode, logoutInstance, setWebhook } from "@/services/evolution";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const workspace = member.workspace;
  const instanceName = workspace.whatsappInstanceId ?? `ws_${workspace.id.slice(0, 8)}`;

  try {
    if (!workspace.whatsappInstanceId) {
      // Instância nova: criar e configurar webhook
      await createInstance(instanceName);
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { whatsappInstanceId: instanceName },
      });
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`;
      await setWebhook(instanceName, webhookUrl).catch(() => {});
    } else {
      // Instância já existe: tentar logout primeiro para garantir que volta pro estado inicial
      // Se a instância não existir mais na Evolution API, recriar
      try {
        await logoutInstance(instanceName);
      } catch {
        // Instância sumiu da Evolution API — recriar
        try {
          await createInstance(instanceName);
          const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`;
          await setWebhook(instanceName, webhookUrl).catch(() => {});
        } catch {
          // Instância pode já ter sido recriada, continua
        }
      }
      // Atualizar status no banco
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { whatsappConnected: false, whatsappPhone: null },
      });
    }

    // Pequena pausa para a instância se estabilizar após logout
    await new Promise((r) => setTimeout(r, 1500));

    const qrData = await getQRCode(instanceName);

    if (!qrData?.qrDataUrl) {
      return NextResponse.json({ error: "QR Code não retornado pela Evolution API" }, { status: 500 });
    }

    return NextResponse.json({
      qrCode: qrData.qrDataUrl,
      pairingCode: qrData?.pairingCode ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[whatsapp/connect]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
