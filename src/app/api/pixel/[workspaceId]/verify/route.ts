import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { workspaceId } = await params;
  if (workspace.id !== workspaceId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "URL não informada" }, { status: 400 });

  // Valida que é uma URL http/https
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  try {
    // Adiciona parâmetro de cache-busting para bypassar WP Rocket e similares
    parsedUrl.searchParams.set("_pingo", Date.now().toString());

    const res = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "PingoPixelVerifier/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({
        found: false,
        detail: `A página retornou status ${res.status}. Verifique se a URL está correta e acessível.`,
      });
    }

    const html = await res.text();
    const hasPixelScript = html.includes("pingo-pixel.js");
    const hasWorkspaceId = html.includes(workspaceId);

    if (hasPixelScript && hasWorkspaceId) {
      return NextResponse.json({
        found: true,
        detail: "Script pingo-pixel.js encontrado com o Pixel ID correto.",
      });
    }

    if (hasPixelScript && !hasWorkspaceId) {
      // Verifica se tem outro workspaceId (pixel de outro workspace)
      return NextResponse.json({
        found: false,
        detail: "O script pingo-pixel.js foi encontrado, mas com um Pixel ID diferente. Verifique se o snippet está com o ID correto desta conta.",
      });
    }

    if (!hasPixelScript && hasWorkspaceId) {
      return NextResponse.json({
        found: false,
        detail: "O Pixel ID foi encontrado na página, mas o script pingo-pixel.js não foi detectado. O snippet pode estar incompleto.",
      });
    }

    return NextResponse.json({
      found: false,
      detail: "O pixel do Pingo não foi encontrado nesta página. Certifique-se de que o snippet foi colado dentro da tag <head>.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("timeout") || msg.includes("abort");
    return NextResponse.json({
      found: false,
      detail: isTimeout
        ? "A página demorou mais de 10 segundos para responder. Verifique se a URL está correta."
        : `Não foi possível acessar a página: ${msg}`,
    });
  }
}

// Também busca se houve algum evento do pixel recentemente (últimas 24h)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getActiveWorkspace();
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { workspaceId } = await params;
  if (workspace.id !== workspaceId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentEvent = await prisma.sitePixelEvent.findFirst({
    where: { workspaceId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { eventName: true, createdAt: true, url: true },
  });

  return NextResponse.json({ recentEvent });
}
