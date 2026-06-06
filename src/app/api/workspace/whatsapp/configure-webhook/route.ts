import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setWebhook } from "@/services/evolution";
import { getActiveWorkspace } from "@/lib/workspace";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();

  if (!workspace?.whatsappInstanceId) {
    return NextResponse.json({ error: "Nenhuma instância conectada" }, { status: 400 });
  }

  const instanceName = workspace.whatsappInstanceId;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`;

  try {
    await setWebhook(instanceName, webhookUrl);
    console.log(`[configure-webhook] Set webhook on ${instanceName} → ${webhookUrl}`);
    return NextResponse.json({ ok: true, instanceName, webhookUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[configure-webhook]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
