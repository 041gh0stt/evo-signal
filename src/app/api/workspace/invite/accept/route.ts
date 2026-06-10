import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Aceita um convite — requer usuário autenticado.
// Cria o WorkspaceMember e marca o convite como aceito.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Você precisa estar logado para aceitar o convite" }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token ausente" }, { status: 400 });
  }

  const invite = await prisma.workspaceInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  if (invite.acceptedAt) return NextResponse.json({ error: "Esse convite já foi aceito" }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Esse convite expirou" }, { status: 410 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  // Convites com e-mail placeholder (gerados via "gerar link") aceitam qualquer usuário logado
  const isPlaceholder = invite.email.startsWith("convite+") && invite.email.endsWith("@pingo.link");
  if (!isPlaceholder && user.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: `Esse convite foi enviado para ${invite.email}. Faça login com essa conta para aceitá-lo.` },
      { status: 403 }
    );
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
  });

  await prisma.$transaction(async (tx) => {
    if (!existing) {
      await tx.workspaceMember.create({
        data: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
      });
    }
    await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true, workspaceId: invite.workspaceId });
}
