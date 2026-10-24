import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const isAuth = !!sessionToken;
  const { pathname } = req.nextUrl;

  // 1. Webhooks y autenticación son siempre públicos
  if (pathname.startsWith("/api/webhooks") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 2. Proteger todas las rutas API de CRM: rechazar con 401 si no está autenticado
  if (pathname.startsWith("/api/crm")) {
    if (!isAuth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 3. Proteger vistas del dashboard: redirigir a /login si no está autenticado
  const isLoginPage = pathname.startsWith("/login");
  const isProtectedPath =
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/kanban") ||
    pathname.startsWith("/knowledge") ||
    pathname.startsWith("/campaigns") ||
    pathname.startsWith("/settings") ||
    pathname === "/";

  if (isProtectedPath && !isAuth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isAuth) {
    return NextResponse.redirect(new URL("/inbox", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
