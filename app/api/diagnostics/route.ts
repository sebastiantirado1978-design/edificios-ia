import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Check WhatsApp token
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    results.whatsapp_token = { status: "missing" };
  } else {
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${token}`, {
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json() as Record<string, unknown>;
      if (data.error) {
        results.whatsapp_token = { status: "expired", error: (data.error as Record<string,string>).message };
      } else {
        results.whatsapp_token = { status: "valid", name: data.name };
      }
    } catch (e) {
      results.whatsapp_token = { status: "error", error: String(e) };
    }
  }

  // Check DB + buildings
  try {
    const { prisma } = await import("@/lib/prisma");
    const [buildings, residents, tickets] = await Promise.all([
      prisma.building.count(),
      prisma.resident.count(),
      prisma.ticket.count(),
    ]);
    results.database = { status: "connected", buildings, residents, tickets };
  } catch (e) {
    results.database = { status: "error", error: String(e) };
  }

  results.anthropic = process.env.ANTHROPIC_API_KEY
    ? { status: "configured" }
    : { status: "missing" };

  results.environment = {
    node_env: process.env.NODE_ENV,
    app_url: process.env.NEXT_PUBLIC_APP_URL,
    uptime: `${Math.round(process.uptime())}s`,
  };

  const ok =
    (results.whatsapp_token as Record<string,string>)?.status === "valid" &&
    (results.database as Record<string,string>)?.status === "connected" &&
    (results.anthropic as Record<string,string>)?.status === "configured";

  return NextResponse.json({ ok, timestamp: new Date().toISOString(), checks: results });
}
