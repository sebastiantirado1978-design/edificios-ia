import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");
    const status = searchParams.get("status");

    const conversations = await prisma.conversation.findMany({
      where: {
        ...(buildingId ? { buildingId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        resident: { select: { fullName: true, phone: true } },
        building: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[conversations GET]", error);
    return NextResponse.json({ error: "Error fetching conversations" }, { status: 500 });
  }
}
