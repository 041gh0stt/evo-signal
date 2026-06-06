import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TrackableLinkPage({ params }: Props) {
  const { slug } = await params;

  const link = await prisma.trackableLink.findFirst({
    where: { slug },
    include: { workspace: { select: { whatsappPhone: true } } },
  });

  if (!link) notFound();

  // Incrementa cliques em background
  await prisma.trackableLink.update({
    where: { id: link.id },
    data: { clicks: { increment: 1 } },
  });

  // Monta URL do WhatsApp com UTMs e mensagem de boas-vindas
  const phone = link.workspace.whatsappPhone?.replace(/\D/g, "") ?? "";
  const text = link.welcomeMessage
    ? encodeURIComponent(link.welcomeMessage)
    : "";

  // Monta UTM params para passar via hash (não ficam no link do WhatsApp, ficam no redirect)
  const utms = new URLSearchParams();
  if (link.utmSource) utms.set("utm_source", link.utmSource);
  if (link.utmMedium) utms.set("utm_medium", link.utmMedium);
  if (link.utmCampaign) utms.set("utm_campaign", link.utmCampaign);
  if (link.utmContent) utms.set("utm_content", link.utmContent);
  utms.set("link_id", link.id);

  const whatsappUrl = `https://wa.me/${phone}${text ? `?text=${text}` : ""}`;

  // Se tem página intermediária, mostra antes de redirecionar
  if (link.hasRedirectPage) {
    return (
      <RedirectPage
        title={link.redirectPageTitle ?? "Você será redirecionado"}
        message={link.redirectPageMessage ?? "Aguarde, você será direcionado para o WhatsApp."}
        delay={link.redirectDelay ?? 5}
        url={whatsappUrl}
      />
    );
  }

  // Redirecionamento direto para o WhatsApp
  redirect(whatsappUrl);
}

function RedirectPage({ title, message, delay, url }: {
  title: string;
  message: string;
  delay: number;
  url: string;
}) {
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content={`${delay};url=${url}`} />
        <title>{title}</title>
        <meta name="robots" content="noindex" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #09090b; color: #f4f4f5; font-family: -apple-system, sans-serif;
                 display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px;
                  padding: 40px; max-width: 400px; width: 90%; text-align: center; }
          h1 { font-size: 1.4rem; font-weight: 700; margin-bottom: 12px; color: #f4f4f5; }
          p { font-size: 0.95rem; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
          .bar-wrap { background: #27272a; border-radius: 99px; height: 6px; overflow: hidden; }
          .bar { height: 100%; background: #10b981; border-radius: 99px;
                 animation: fill ${delay}s linear forwards; }
          @keyframes fill { from { width: 0% } to { width: 100% } }
          a { display: inline-block; margin-top: 20px; color: #10b981; font-size: 0.85rem; text-decoration: none; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <h1>{title}</h1>
          <p>{message}</p>
          <div className="bar-wrap"><div className="bar" /></div>
          <a href={url}>Clique aqui se não for redirecionado automaticamente →</a>
        </div>
      </body>
    </html>
  );
}
