import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  if (!isLoggedIn && !isAuthPage && !pathname.startsWith("/onboarding") && !pathname.startsWith("/demo") && !pathname.startsWith("/demo-funil") && !pathname.startsWith("/demo-conversas") && !pathname.startsWith("/r/") && !pathname.startsWith("/conectar/")) {
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
