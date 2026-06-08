import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";
import { sendEmail, workspaceInviteEmailHtml } from "@/lib/email";

// Lista membros + convites pendentes do workspace ativo
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [members, invites] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceInvite.findMany({
      where: { workspaceId: workspace.id, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    role: member.role,
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      isYou: m.userId === session.user!.id,
    })),
    invites: invites.map((i) => ({ id: i.id, email: i.email, role: i.role, token: i.token, expiresAt: i.expiresAt })),
  });
}

// Cria um convite (apenas owner)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: session.user.id } },
  });
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Apenas o dono do workspace pode convidar membros" }, { status: 403 });
  }

  const { email, role } = await req.json();
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }
  const finalRole = role === "owner" ? "owner" : "member";

  // Já é membro?
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const alreadyMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: existingUser.id } },
    });
    if (alreadyMember) {
      return NextResponse.json({ error: "Essa pessoa já faz parte do workspace" }, { status: 409 });
    }
  }

  // Já existe convite pendente para esse e-mail nesse workspace?
  const existingInvite = await prisma.workspaceInvite.findFirst({
    where: { workspaceId: workspace.id, email, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "Já existe um convite pendente para esse e-mail" }, { status: 409 });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  const invite = await prisma.workspaceInvite.create({
    data: { workspaceId: workspace.id, email, role: finalRole, token, expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const inviteUrl = `${baseUrl}/convite/${token}`;

  await sendEmail({
    to: email,
    subject: `Convite para o workspace "${workspace.name}" no Pingo`,
    html: workspaceInviteEmailHtml({ workspaceName: workspace.name, inviteUrl }),
  });

  return NextResponse.json({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    token: invite.token,
    expiresAt: invite.expiresAt,
    inviteUrl,
  }, { status: 201 });
}
