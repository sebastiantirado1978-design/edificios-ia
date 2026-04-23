import { NextResponse } from "next/server";
import { getTicketsByBuilding } from "@/agents/tools";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const buildingId = searchParams.get("buildingId") ?? "";
  const status = searchParams.get("status") ?? undefined;
  try {
    const result = await getTicketsByBuilding(buildingId, status);
    return NextResponse.json(result.data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
