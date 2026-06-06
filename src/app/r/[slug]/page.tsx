import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { RedirectClient } from "./redirect-client";

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

  // Incrementa cliques
  await prisma.trackableLink.update({
    where: { id: link.id },
    data: { clicks: { increment: 1 } },
  });

  const phone = link.workspace.whatsappPhone?.replace(/\D/g, "") ?? "";
  const text = link.welcomeMessage ? encodeURIComponent(link.welcomeMessage) : "";
  const whatsappUrl = `https://wa.me/${phone}${text ? `?text=${text}` : ""}`;

  // Redirecionamento direto
  if (!link.hasRedirectPage) {
    redirect(whatsappUrl);
  }

  // Página intermediária com countdown
  return (
    <RedirectClient
      title={link.redirectPageTitle ?? "Você será redirecionado"}
      message={link.redirectPageMessage ?? "Aguarde, você será direcionado para o WhatsApp."}
      delay={link.redirectDelay ?? 5}
      url={whatsappUrl}
    />
  );
}
