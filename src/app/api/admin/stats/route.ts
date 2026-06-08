import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

// Endpoint exclusivo do painel /admin — lista usuários e workspaces com dados básicos
export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, workspaces, totals] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { workspaces: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        whatsappConnected: true,
        metaPixelId: true,
        createdAt: true,
        _count: { select: { members: true, trackableLinks: true } },
        members: {
          where: { role: "owner" },
          take: 1,
          select: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.workspace.count({ where: { whatsappConnected: true } }),
    ]),
  ]);

  const [userCount, workspaceCount, connectedCount] = totals;

  return NextResponse.json({
    totals: { users: userCount, workspaces: workspaceCount, connected: connectedCount },
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      workspaceCount: u._count.workspaces,
    })),
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      whatsappConnected: w.whatsappConnected,
      hasMetaPixel: !!w.metaPixelId,
      createdAt: w.createdAt,
      memberCount: w._count.members,
      linkCount: w._count.trackableLinks,
      owner: w.members[0]?.user ?? null,
    })),
  });
}
