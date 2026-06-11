import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const link = await prisma.trackableLink.findFirst({ where: { slug } });
  if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  // Captura dados de contexto do clique para enriquecer eventos de pixel e atribuição
  const clientIp = getClientIp(req);
  const clientUserAgent = req.headers.get("user-agent") ?? null;
  const p = req.nextUrl.searchParams;

  // Meta Ads: fbclid adicionado automaticamente pelo Meta em links de anúncio
  const fbclid = p.get("fbclid") ?? null;
  const fbc = fbclid ? `fb.1.${Date.now()}.${fbclid}` : null;

  // Google Ads: gclid + parâmetros ValueTrack ({campaignid}, {adgroupid}, {creative})
  // O anunciante precisa adicionar esses params na URL final do anúncio no Google Ads
  const gclid           = p.get("gclid") ?? null;
  const googleCampaignId = p.get("campaignid") ?? p.get("utm_campaignid") ?? null;
  const googleAdGroupId  = p.get("adgroupid")  ?? null;
  const googleAdId       = p.get("creative")   ?? p.get("adid") ?? null;

  await prisma.trackableLink.update({
    where: { id: link.id },
    data: {
      clicks: { increment: 1 },
      lastClickIp: clientIp,
      lastClickUserAgent: clientUserAgent,
      lastClickFbc: fbc,
      lastClickGclid: gclid,
      lastClickAt: new Date(),
    },
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: link.workspaceId },
    select: { whatsappPhone: true },
  });

  const phone = workspace?.whatsappPhone?.replace(/\D/g, "") ?? "";

  // Monta a URL do WhatsApp com mensagem pré-preenchida
  const waParams = new URLSearchParams();
  if (link.welcomeMessage) waParams.set("text", link.welcomeMessage);

  // Adiciona UTMs como ref
  const utmParams = new URLSearchParams();
  if (link.utmSource) utmParams.set("utm_source", link.utmSource);
  if (link.utmMedium) utmParams.set("utm_medium", link.utmMedium);
  if (link.utmCampaign) utmParams.set("utm_campaign", link.utmCampaign);
  if (link.utmContent) utmParams.set("utm_content", link.utmContent);
  utmParams.set("ref", link.slug);

  const waUrl = phone
    ? `https://api.whatsapp.com/send?phone=${phone}${link.welcomeMessage ? `&text=${encodeURIComponent(link.welcomeMessage)}` : ""}`
    : `https://wa.me/`;

  // Se tem página de espera, renderiza HTML intermediário
  if (link.hasRedirectPage) {
    const delay = link.redirectDelay ?? 5;
    const title = link.redirectPageTitle ?? "Aguarde alguns segundos...";
    const message = link.redirectPageMessage ?? "Estamos conectando você com um atendente...";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #09090b;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      color: #f4f4f5;
    }
    .card {
      text-align: center;
      padding: 2.5rem;
      max-width: 380px;
      width: 90%;
    }
    .icon {
      width: 64px;
      height: 64px;
      background: #10b98120;
      border: 2px solid #10b98140;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; }
    p { color: #71717a; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
    .progress-bar {
      width: 100%;
      height: 4px;
      background: #27272a;
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }
    .progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 999px;
      animation: fill ${delay}s linear forwards;
    }
    .countdown { font-size: 0.75rem; color: #52525b; }
    @keyframes fill { from { width: 0% } to { width: 100% } }
  </style>
  <meta http-equiv="refresh" content="${delay};url=${waUrl}">
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M3 21l1.9-5.7A8.5 8.5 0 1 1 8.5 17.8L3 21z" fill="#10b981" opacity="0.3"/>
        <path d="M3 21l1.9-5.7A8.5 8.5 0 1 1 8.5 17.8L3 21z" stroke="#10b981" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="progress-bar"><div class="progress-fill"></div></div>
    <p class="countdown">Redirecionando em ${delay} segundos...</p>
  </div>
  <script>
    setTimeout(() => window.location.href = ${JSON.stringify(waUrl)}, ${delay * 1000});
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.redirect(waUrl);
}
