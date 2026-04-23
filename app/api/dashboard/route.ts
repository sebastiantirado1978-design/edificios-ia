import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/agents/tools";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const buildingId = searchParams.get("buildingId") ?? undefined;
  try {
    const metrics = await getDashboardMetrics(buildingId);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[Dashboard]", error);
    return NextResponse.json({ error: "Error loading metrics" }, { status: 500 });
  }
}
