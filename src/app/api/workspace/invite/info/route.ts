import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint público — retorna informações básicas de um convite a partir do token
// (usado pela página /convite/[token] antes do login)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token ausente" }, { status: 400 });

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: { select: { name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }
  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Esse convite já foi aceito" }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Esse convite expirou" }, { status: 410 });
  }

  return NextResponse.json({
    workspaceName: invite.workspace.name,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
  });
}
