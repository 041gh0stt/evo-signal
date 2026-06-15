import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Rotas que NÃO precisam de login
const PUBLIC_PATHS = [
  "/landing",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/convite",
  "/conectar",
  "/demo",
  "/r/",                        // links rastreáveis
  "/api/auth",                  // endpoints do NextAuth
  "/api/pixel",                 // pixel endpoint (chamado por sites externos)
  "/api/webhooks",              // webhooks externos (Evolution API)
  "/api/public",                // endpoints públicos
  "/landing/",                  // assets da landing page
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?|ttf|ico)$).*)"],
};
