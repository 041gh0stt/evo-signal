import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { metaPixelId, metaAccessToken, metaTestEventCode } = await req.json();

  await prisma.workspace.update({
    where: { id: member.workspaceId },
    data: { metaPixelId, metaAccessToken, metaTestEventCode },
  });

  return NextResponse.json({ ok: true });
}
