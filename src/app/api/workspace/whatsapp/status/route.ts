import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstanceStatus, getInstanceInfo } from "@/services/evolution";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!member?.workspace.whatsappInstanceId) {
    return NextResponse.json({ connected: false });
  }

  try {
    const status = await getInstanceStatus(member.workspace.whatsappInstanceId);
    // v2: { instance: { instanceName, state } }
    const connected = status?.instance?.state === "open";

    if (connected) {
      // Buscar número via fetchInstances (retorna ownerJid / profileName)
      let phone = member.workspace.whatsappPhone;
      try {
        const info = await getInstanceInfo(member.workspace.whatsappInstanceId);
        // ownerJid formato: 5511999990000@s.whatsapp.net
        const ownerJid: string = info?.ownerJid ?? info?.instance?.ownerJid ?? "";
        if (ownerJid) phone = ownerJid.split("@")[0];
      } catch {
        // fallback: mantém o número já salvo
      }

      // Persistir no banco para sobreviver a F5
      await prisma.workspace.update({
        where: { id: member.workspace.id },
        data: {
          whatsappConnected: true,
          whatsappPhone: phone,
        },
      });

      return NextResponse.json({ connected: true, phone });
    }

    // Se estava marcado como conectado no banco mas Evolution API diz que não está
    if (member.workspace.whatsappConnected) {
      await prisma.workspace.update({
        where: { id: member.workspace.id },
        data: { whatsappConnected: false },
      });
    }

    return NextResponse.json({ connected: false });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
