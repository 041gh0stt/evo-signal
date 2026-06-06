import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteInstance } from "@/services/evolution";
import { getActiveWorkspace } from "@/lib/workspace";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const instanceId = workspace.whatsappInstanceId;
  if (instanceId) {
    await deleteInstance(instanceId).catch(() => {});
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { whatsappConnected: false, whatsappInstanceId: null, whatsappPhone: null },
  });

  return NextResponse.json({ ok: true });
}
