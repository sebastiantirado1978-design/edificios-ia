/**
 * middleware.ts — Edificios IA
 *
 * Tenant isolation por organización + edificio.
 * Rutas públicas: webhook (WhatsApp Meta), ping, diagnostics.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/api/webhooks",
  "/api/ping",
  "/api/diagnostics",
  "/api/auth",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) return NextResponse.next();

  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // Extraer contexto de tenant del header (inyectado por el cliente autenticado)
  const orgId = request.headers.get("X-Organization-Id");
  const buildingId = request.headers.get("X-Building-Id");

  if (!orgId && process.env.NODE_ENV === "production" && process.env.REQUIRE_AUTH === "true") {
    return NextResponse.json(
      { error: "Unauthorized", message: "X-Organization-Id header requerido" },
      { status: 401 }
    );
  }

  const requestHeaders = new Headers(request.headers);
  if (orgId) requestHeaders.set("X-Organization-Id", orgId);
  if (buildingId) requestHeaders.set("X-Building-Id", buildingId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/api/:path*"],
};
