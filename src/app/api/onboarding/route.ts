import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

  const workspace = await prisma.workspace.create({
    data: {
      name: name.trim(),
      slug,
      members: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
    },
  });

  return NextResponse.json(workspace, { status: 201 });
}
