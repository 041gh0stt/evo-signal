import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setWebhook } from "@/services/evolution";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!member?.workspace.whatsappInstanceId) {
    return NextResponse.json({ error: "WhatsApp não conectado" }, { status: 400 });
  }

  try {
    const webhookUrl = `${url.replace(/\/$/, "")}/api/webhooks/evolution`;
    await setWebhook(member.workspace.whatsappInstanceId, webhookUrl);
    return NextResponse.json({ ok: true, webhookUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
