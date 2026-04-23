import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");

    const residents = await prisma.resident.findMany({
      where: buildingId ? { buildingId } : undefined,
      orderBy: { registeredAt: "desc" },
      include: {
        unit: { select: { number: true, floor: true } },
        building: { select: { name: true } },
      },
    });

    return NextResponse.json({ residents });
  } catch (error) {
    console.error("[residents GET]", error);
    return NextResponse.json({ error: "Error fetching residents" }, { status: 500 });
  }
}
