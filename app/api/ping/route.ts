import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Edificios IA",
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(process.uptime())}s`,
  });
}
