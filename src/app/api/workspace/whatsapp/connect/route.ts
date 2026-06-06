import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInstance, getQRCode, logoutInstance, setWebhook } from "@/services/evolution";

function toInstanceName(workspaceName: string): string {
  return workspaceName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9\s]/g, "")    // remove caracteres especiais
    .trim()
    .replace(/\s+/g, "_")            // espaços → underscore
    .slice(0, 50);                   // limita tamanho
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const workspace = member.workspace;

  // Usa o nome do workspace para gerar o instanceName
  const instanceName = workspace.whatsappInstanceId
    ?? toInstanceName(workspace.name)
    || `ws_${workspace.id.slice(0, 8)}`;

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
      // Instância existente: logout para resetar e gerar novo QR
      try {
        await logoutInstance(instanceName);
      } catch {
        // Instância pode não existir mais — recriar
        try {
          await createInstance(instanceName);
          const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`;
          await setWebhook(instanceName, webhookUrl).catch(() => {});
        } catch { /* já existe, continua */ }
      }
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { whatsappConnected: false, whatsappPhone: null },
      });
    }

    // Aguarda instância estabilizar
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
