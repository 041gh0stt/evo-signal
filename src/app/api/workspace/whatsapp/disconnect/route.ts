import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteInstance } from "@/services/evolution";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const instanceId = member.workspace.whatsappInstanceId;
  if (instanceId) {
    await deleteInstance(instanceId).catch(() => {});
  }

  await prisma.workspace.update({
    where: { id: member.workspace.id },
    data: { whatsappConnected: false, whatsappInstanceId: null, whatsappPhone: null },
  });

  return NextResponse.json({ ok: true });
}
