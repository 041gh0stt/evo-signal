import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Páginas públicas que não exigem sessão ativa
  const isPublicAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  // Dessas, só login/registro redirecionam para o dashboard se o usuário já estiver logado
  // (esqueci-senha/redefinir-senha continuam acessíveis mesmo com sessão ativa)
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // /demo* cobre todas as páginas demo (dashboard, funil, conversas, links, pixel, clientes, configuracoes)
  if (!isLoggedIn && !isPublicAuthPage && !pathname.startsWith("/onboarding") && !pathname.startsWith("/demo") && !pathname.startsWith("/r/") && !pathname.startsWith("/conectar/") && !pathname.startsWith("/convite/")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Ignora rotas de API, assets internos do Next e qualquer arquivo estático
  // da pasta /public (imagens, ícones, svgs etc.) — identificados pela extensão no path.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)"],
};
