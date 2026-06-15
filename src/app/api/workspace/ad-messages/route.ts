import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { metaAdMessages } = await req.json();

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { metaAdMessages: typeof metaAdMessages === "string" ? metaAdMessages.trim() || null : null },
  });

  return NextResponse.json({ ok: true });
}
