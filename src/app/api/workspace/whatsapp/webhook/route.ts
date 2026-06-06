import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setWebhook } from "@/services/evolution";
import { getActiveWorkspace } from "@/lib/workspace";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });

  const workspace = await getActiveWorkspace();

  if (!workspace?.whatsappInstanceId) {
    return NextResponse.json({ error: "WhatsApp não conectado" }, { status: 400 });
  }

  try {
    const webhookUrl = `${url.replace(/\/$/, "")}/api/webhooks/evolution`;
    await setWebhook(workspace.whatsappInstanceId, webhookUrl);
    return NextResponse.json({ ok: true, webhookUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
