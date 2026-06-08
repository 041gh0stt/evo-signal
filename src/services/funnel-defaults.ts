import { prisma } from "@/lib/prisma";

/**
 * Cria a etapa padrão "Primeiro Contato" para um workspace novo.
 * Toda conta deve nascer com essa etapa: assim que o lead manda a primeira
 * mensagem, ele é automaticamente movido pra ela e o evento "Contact" é
 * disparado para o Meta Pixel — sem precisar configurar nada.
 */
export async function seedDefaultFunnelStages(workspaceId: string) {
  const existing = await prisma.funnelStage.findFirst({ where: { workspaceId } });
  if (existing) return; // não sobrescreve workspaces que já têm etapas

  await prisma.funnelStage.create({
    data: {
      workspaceId,
      name: "Primeiro Contato",
      color: "#f59e0b",
      order: 0,
      pixelEventName: "Contact",
      isFirstContact: true,
      isSale: false,
    },
  });
}
