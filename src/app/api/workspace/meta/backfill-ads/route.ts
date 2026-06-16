import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

// Busca nome de campanha/conjunto/anúncio na Graph API usando o ID do anúncio (adSourceId)
async function fetchAdDetails(adId: string, token: string) {
  try {
    const url = `https://graph.facebook.com/v19.0/${adId}?fields=name,adset%7Bname%7D,campaign%7Bname%7D&access_token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { name?: string; adset?: { name?: string }; campaign?: { name?: string } };
    return {
      adName: data.name ?? null,
      adSetName: data.adset?.name ?? null,
      adCampaignName: data.campaign?.name ?? null,
    };
  } catch {
    return null;
  }
}

// POST: reprocessa conversas de anúncio que já têm adSourceId mas ainda não têm nome de campanha,
// buscando os dados na API do Meta. Usado para preencher leads antigos detectados antes da feature.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const token = workspace.metaUserToken ?? workspace.metaAccessToken;
  if (!token) return NextResponse.json({ error: "Meta não conectado" }, { status: 400 });

  // Conversas com ID de anúncio salvo mas sem nome de campanha resolvido
  const pending = await prisma.conversation.findMany({
    where: {
      workspaceId: workspace.id,
      adSourceId: { not: null },
      adCampaignName: null,
    },
    select: { id: true, adSourceId: true },
    take: 200,
  });

  let updated = 0;
  let failed = 0;

  for (const conv of pending) {
    if (!conv.adSourceId) continue;
    const details = await fetchAdDetails(conv.adSourceId, token);
    if (details && (details.adCampaignName || details.adSetName || details.adName)) {
      await prisma.conversation.update({ where: { id: conv.id }, data: details });
      updated++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, total: pending.length, updated, failed });
}
