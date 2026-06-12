import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { fireConversionEvent } from "@/services/meta-pixel";

// Headers CORS — essa rota é pública e chamada a partir do site do cliente
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  // Aceita tanto "eventName" (novo pixel) quanto "event" (snippet legado)
  const eventName = (typeof body.eventName === "string" ? body.eventName.trim() : null)
    ?? (typeof body.event === "string" ? body.event.trim() : null)
    ?? "PageView";
  if (!eventName) {
    return NextResponse.json({ error: "Missing event name" }, { status: 400, headers: CORS_HEADERS });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, metaPixelId: true, metaAccessToken: true, metaTestEventCode: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const clientIp = getClientIp(req);
  const clientUserAgent = req.headers.get("user-agent") ?? (typeof body.ua === "string" ? body.ua : null);

  // Parâmetros capturados pelo snippet na landing page
  const fbclid      = typeof body.fbclid      === "string" ? body.fbclid      : null;
  const gclid       = typeof body.gclid       === "string" ? body.gclid       : null;
  // Aceita camelCase (novo pixel) e snake_case (snippet legado)
  const utmSource   = (typeof body.utmSource   === "string" ? body.utmSource   : null) ?? (typeof body.utm_source   === "string" ? body.utm_source   : null);
  const utmMedium   = (typeof body.utmMedium   === "string" ? body.utmMedium   : null) ?? (typeof body.utm_medium   === "string" ? body.utm_medium   : null);
  const utmCampaign = (typeof body.utmCampaign === "string" ? body.utmCampaign : null) ?? (typeof body.utm_campaign === "string" ? body.utm_campaign : null);
  const campaignId  = typeof body.campaignid  === "string" ? body.campaignid  : null;
  const adGroupId   = typeof body.adgroupid   === "string" ? body.adgroupid   : null;
  const adId        = typeof body.creative    === "string" ? body.creative    : null;
  const url         = typeof body.url         === "string" ? body.url         : null;
  const referrer    = typeof body.referrer    === "string" ? body.referrer    : null;
  const rawCustom   = body.customData ?? body.data;
  const customData  = rawCustom && typeof rawCustom === "object" && !Array.isArray(rawCustom)
    ? rawCustom as Record<string, unknown>
    : null;

  // Usa fbc enviado pelo pixel (do cookie _fbc) ou gera a partir do fbclid
  const fbc = (typeof body.fbc === "string" ? body.fbc : null)
    ?? (fbclid ? `fb.1.${Date.now()}.${fbclid}` : null);

  // Salva o evento no banco
  const siteEvent = await prisma.sitePixelEvent.create({
    data: {
      workspaceId: workspace.id,
      eventName,
      url,
      referrer,
      clientIp,
      clientUserAgent,
      fbclid,
      fbc,
      gclid,
      utmSource,
      utmMedium,
      utmCampaign,
      campaignId,
      adGroupId,
      adId,
      customData: customData as Prisma.InputJsonValue | undefined,
    },
  });

  // Dispara pro Meta Conversions API se o workspace tiver pixel configurado
  // e o evento for um evento padrão ou Lead (qualquer evento dispara no site)
  if (workspace.metaPixelId && workspace.metaAccessToken) {
    try {
      await fireConversionEvent({
        eventName,
        eventId: siteEvent.id,
        eventTime: Math.floor(Date.now() / 1000),
        // phone omitido — eventos de site não têm telefone
        pixelId: workspace.metaPixelId,
        accessToken: workspace.metaAccessToken,
        testEventCode: workspace.metaTestEventCode ?? undefined,
        clientIp,
        clientUserAgent,
        fbc,
        customData: {
          ...customData,
          page_url: url,
          utm_source: utmSource ?? undefined,
        },
      });
      await prisma.sitePixelEvent.update({
        where: { id: siteEvent.id },
        data: { sentToMeta: true, metaEventId: siteEvent.id },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.sitePixelEvent.update({
        where: { id: siteEvent.id },
        data: { metaError: msg.slice(0, 500) },
      });
    }
  }

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
