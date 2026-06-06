import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json([]);

  const links = await prisma.trackableLink.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const {
    name, utmSource, utmMedium, utmCampaign, utmContent,
    welcomeMessage, hasRedirectPage, redirectPageTitle,
    redirectPageMessage, redirectDelay,
  } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) +
    "-" + Date.now().toString(36);

  const link = await prisma.trackableLink.create({
    data: {
      workspaceId: workspace.id,
      name: name.trim(),
      slug,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmContent: utmContent || null,
      welcomeMessage: welcomeMessage || null,
      hasRedirectPage: hasRedirectPage ?? false,
      redirectPageTitle: redirectPageTitle || null,
      redirectPageMessage: redirectPageMessage || null,
      redirectDelay: redirectDelay ?? 5,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
