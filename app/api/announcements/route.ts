import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId");

    const announcements = await prisma.announcement.findMany({
      where: buildingId ? { buildingId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        building: { select: { name: true } },
      },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("[announcements GET]", error);
    return NextResponse.json({ error: "Error fetching announcements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buildingId, title, content, targetRoles, priority } = body;

    if (!buildingId || !title || !content) {
      return NextResponse.json({ error: "buildingId, title, content requeridos" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        buildingId,
        title,
        content,
        targetRoles: targetRoles ? (Array.isArray(targetRoles) ? targetRoles.join(",") : targetRoles) : "todos",
        sentViaWA: false,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("[announcements POST]", error);
    return NextResponse.json({ error: "Error creating announcement" }, { status: 500 });
  }
}
