import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

const VALID_ORIGINS = ["meta_ads", "google_ads", "untracked"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { id } = await params;
  const { origin } = await req.json();

  if (!VALID_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, workspaceId: workspace.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.conversation.update({
    where: { id },
    data: { origin },
  });

  return NextResponse.json({ ok: true });
}
